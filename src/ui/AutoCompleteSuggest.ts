import {
  App,
  debounce,
  Debouncer,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  EventRef,
  KeymapEventHandler,
  MarkdownView,
  Scope,
  TFile,
} from "obsidian";
import {
  capitalizeFirstLetter,
  lowerStartsWith,
  lowerStartsWithoutSpace,
  startsWithoutSpace,
} from "../util/strings";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";
import { CustomDictionaryService, Word } from "../CustomDictionaryService";
import { uniq } from "../util/collection-helper";
import { AppHelper } from "../app-helper";

function suggestWords(words: Word[], query: string, max: number): Word[] {
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;
  return Array.from(words)
    .map((x) => {
      if (x.value === query) {
        return { word: x, alias: false };
      }

      if (
        x.value.startsWith("[[")
          ? lowerStartsWithoutSpace(x.value.replace("[[", ""), query)
          : startsWithoutSpace(x.value, query)
      ) {
        return { word: x, value: x.value, alias: false };
      }

      if (
        queryStartWithUpper &&
        startsWithoutSpace(capitalizeFirstLetter(x.value), query)
      ) {
        x.value = capitalizeFirstLetter(x.value);
        return { word: x, value: x.value, alias: false };
      }

      const matchedAlias = x.aliases?.find((a) =>
        lowerStartsWithoutSpace(a, query)
      );
      if (matchedAlias) {
        return { word: x, value: matchedAlias, alias: true };
      }

      return { word: x, alias: false };
    })
    .filter((x) => x.value !== undefined)
    .sort((a, b) => {
      const aliasP = (Number(a.alias) - Number(b.alias)) * 10000;
      const startP =
        (Number(lowerStartsWith(b.value!, query)) -
          Number(lowerStartsWith(a.value!, query))) *
        1000;
      const lengthP = a.value!.length - b.value!.length;
      return aliasP + startP + lengthP;
    })
    .map((x) => x.word)
    .slice(0, max);
}

// This is an unsafe code..!!
interface UnsafeEditorSuggestInterface {
  scope: Scope & { keys: (KeymapEventHandler & { func: CallableFunction })[] };
  suggestions: {
    selectedItem: number;
    useSelectedItem(ev: Partial<KeyboardEvent>): void;
  };
}

export class AutoCompleteSuggest
  extends EditorSuggest<Word>
  implements UnsafeEditorSuggestInterface
{
  app: App;
  settings: Settings;
  customDictionaryService: CustomDictionaryService;
  appHelper: AppHelper;

  currentFileTokens: string[] = [];
  internalLinkTokens: Word[] = [];
  tokenizer: Tokenizer;
  debounceGetSuggestions: Debouncer<
    [EditorSuggestContext, (tokens: Word[]) => void]
  >;
  debounceClose: Debouncer<[]>;

  disabled: boolean;

  // unsafe!!
  scope: UnsafeEditorSuggestInterface["scope"];
  suggestions: UnsafeEditorSuggestInterface["suggestions"];

  keymapEventHandler: KeymapEventHandler[] = [];
  modifyEventRef: EventRef;
  activeLeafChangeRef: EventRef;

  private constructor(
    app: App,
    customDictionaryService: CustomDictionaryService
  ) {
    super(app);
    this.appHelper = new AppHelper(app);
    this.customDictionaryService = customDictionaryService;
  }

  triggerComplete() {
    const editor = this.appHelper.getMarkdownViewInActiveLeaf()?.editor;
    const activeFile = this.app.workspace.getActiveFile();
    if (!editor || !activeFile) {
      return;
    }

    // XXX: Unsafe
    (this as any).trigger(editor, activeFile, true);
  }

  static async new(app: App, settings: Settings): Promise<AutoCompleteSuggest> {
    const ins = new AutoCompleteSuggest(
      app,
      new CustomDictionaryService(
        app,
        settings.customDictionaryPaths.split("\n").filter((x) => x)
      )
    );

    await ins.updateSettings(settings);
    await ins.refreshCustomDictionaryTokens();

    ins.modifyEventRef = app.vault.on("modify", async (_) => {
      await ins.refreshCurrentFileTokens();
    });
    ins.activeLeafChangeRef = app.workspace.on(
      "active-leaf-change",
      async (_) => {
        await ins.refreshCurrentFileTokens();
        ins.refreshInternalLinkTokens();
      }
    );
    // Avoid to refer incomplete cache
    const cacheResolvedRef = app.metadataCache.on("resolved", () => {
      ins.refreshInternalLinkTokens();
      ins.app.metadataCache.offref(cacheResolvedRef);
    });

    return ins;
  }

  unregister() {
    this.app.vault.offref(this.modifyEventRef);
    this.app.workspace.offref(this.activeLeafChangeRef);
  }

  get tokenizerStrategy(): TokenizeStrategy {
    return TokenizeStrategy.fromName(this.settings.strategy);
  }

  get minNumberTriggered(): number {
    return (
      this.settings.minNumberOfCharactersTriggered ||
      this.tokenizerStrategy.triggerThreshold
    );
  }

  get words(): Word[] {
    const currentFileWords = this.currentFileTokens
      .filter((x) => !this.customDictionaryService.wordsByValue[x])
      .map((x) => ({ value: x }));

    return [
      ...currentFileWords,
      ...this.customDictionaryService.words,
      ...this.internalLinkTokens,
    ];
  }

  toggleEnabled(): void {
    this.disabled = !this.disabled;
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;
    this.customDictionaryService.updatePaths(
      settings.customDictionaryPaths.split("\n").filter((x) => x)
    );
    this.tokenizer = createTokenizer(this.tokenizerStrategy);

    this.debounceGetSuggestions = debounce(
      (context: EditorSuggestContext, cb: (words: Word[]) => void) => {
        const start = performance.now();
        cb(
          suggestWords(
            this.words,
            context.query,
            this.settings.maxNumberOfSuggestions
          )
        );
        this.showDebugLog("Get suggestions", performance.now() - start);
      },
      this.settings.delayMilliSeconds,
      true
    );

    this.debounceClose = debounce(() => {
      this.close();
    }, this.settings.delayMilliSeconds + 50);

    // new
    this.keymapEventHandler.forEach((x) => this.scope.unregister(x));
    this.keymapEventHandler = [
      this.scope.register([], "Tab", () => {
        this.suggestions.useSelectedItem({});
        return false;
      }),
    ];

    // overwrite
    this.scope.keys.find((x) => x.key === "Escape")!.func = () => {
      this.close();
      return this.settings.propagateEsc;
    };
  }

  async refreshCurrentFileTokens(): Promise<void> {
    const start = performance.now();

    if (!this.settings.enableCurrentFileComplement) {
      this.currentFileTokens = [];
      this.showDebugLog(
        "👢 Skip: Index current file tokens",
        performance.now() - start
      );
      return;
    }

    this.currentFileTokens = await this.pickTokens();
    this.showDebugLog("Index current file tokens", performance.now() - start);
  }

  async refreshCustomDictionaryTokens(): Promise<void> {
    const start = performance.now();

    if (!this.settings.enableCustomDictionaryComplement) {
      this.customDictionaryService.clearTokens();
      this.showDebugLog(
        "👢Skip: Index custom dictionary tokens",
        performance.now() - start
      );
      return;
    }

    await this.customDictionaryService.refreshCustomTokens();
    this.showDebugLog(
      "Index custom dictionary tokens",
      performance.now() - start
    );
  }

  refreshInternalLinkTokens(): void {
    const start = performance.now();

    if (!this.settings.enableInternalLinkComplement) {
      this.internalLinkTokens = [];
      this.showDebugLog(
        "👢Skip: Index internal link tokens",
        performance.now() - start
      );
      return;
    }

    const resolvedInternalLinkTokens = this.app.vault
      .getMarkdownFiles()
      .map((x) => ({
        value: `[[${x.basename}]]`,
        aliases: [x.basename, ...this.appHelper.getAliases(x)],
        description: x.path,
      }));

    const unresolvedInternalLinkTokens = this.appHelper
      .searchPhantomLinks()
      .map((x) => ({
        value: `[[${x}]]`,
        aliases: [x],
        description: "Not created yet",
      }));

    this.showDebugLog("Index internal link tokens", performance.now() - start);

    this.internalLinkTokens = [
      ...resolvedInternalLinkTokens,
      ...unresolvedInternalLinkTokens,
    ];
  }

  async pickTokens(): Promise<string[]> {
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return [];
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return [];
    }

    const content = await this.app.vault.cachedRead(file);
    return uniq(this.tokenizer.tokenize(content));
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    if (this.disabled) {
      return null;
    }

    if (
      this.settings.disableSuggestionsDuringImeOn &&
      this.appHelper.isIMEOn()
    ) {
      return null;
    }

    const currentChar = editor.getRange(
      { line: cursor.line, ch: cursor.ch - 1 },
      cursor
    );
    if (currentChar.match(this.tokenizer.getTrimPattern())) {
      return null;
    }

    const currentToken = this.tokenizer
      .tokenize(editor.getLine(cursor.line).slice(0, cursor.ch))
      .last();
    if (!currentToken || currentToken.length < this.minNumberTriggered) {
      return null;
    }

    if (this.tokenizer.shouldIgnore(currentToken)) {
      return null;
    }

    return {
      start: {
        ch: cursor.ch - currentToken.length,
        line: cursor.line,
      },
      end: cursor,
      query: currentToken,
    };
  }

  getSuggestions(context: EditorSuggestContext): Word[] | Promise<Word[]> {
    return new Promise((resolve) => {
      this.debounceGetSuggestions(context, (words) => {
        resolve(words);
      });
    });
  }

  renderSuggestion(word: Word, el: HTMLElement): void {
    const base = createDiv();
    base.createDiv({ text: word.value });

    if (word.description) {
      base.createDiv({
        cls: "various-complements__suggest__description",
        text: word.description,
      });
    }

    el.appendChild(base);
  }

  selectSuggestion(word: Word, evt: MouseEvent | KeyboardEvent): void {
    if (this.context) {
      const after = this.settings.insertAfterCompletion
        ? `${word.value} `
        : word.value;

      this.context.editor.replaceRange(
        after,
        this.context.start,
        this.context.end
      );
      this.close();
      this.debounceClose();
    }
  }

  private showDebugLog(message: string, msec: number) {
    if (this.settings.showLogAboutPerformanceInConsole) {
      console.log(`${message}: ${Math.round(msec)}[ms]`);
    }
  }
}
