import {
  App,
  debounce,
  Debouncer,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  MarkdownView,
  Scope,
  TFile,
} from "obsidian";
import { caseIncludesWithoutSpace, lowerStartsWith } from "../util/strings";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";
import { CustomDictionaryService, Word } from "../CustomDictionaryService";
import { uniq } from "../util/collection-helper";
import { AppHelper } from "../app-helper";

function suggestWords(words: Word[], query: string, max: number): Word[] {
  return Array.from(words)
    .filter((x) => x.value !== query)
    .filter(
      (x) =>
        caseIncludesWithoutSpace(x.value, query) ||
        x.aliases?.some((a) => caseIncludesWithoutSpace(a, query))
    )
    .sort((a, b) => a.value.length - b.value.length)
    .sort(
      (a, b) =>
        Number(lowerStartsWith(b.value, query)) -
        Number(lowerStartsWith(a.value, query))
    )
    .slice(0, max);
}

// This is an unsafe code..!!
interface UnsafeEditorSuggestInterface {
  scope: Scope;
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

  private constructor(
    app: App,
    customDictionaryService: CustomDictionaryService
  ) {
    super(app);
    this.appHelper = new AppHelper(app);
    this.customDictionaryService = customDictionaryService;
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
    await ins.refreshCustomToken();
    ins.refreshInternalLinkTokens();

    app.vault.on("modify", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
    });
    app.workspace.on("active-leaf-change", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
      ins.refreshInternalLinkTokens();
    });

    ins.scope.register([], "Tab", () => {
      ins.suggestions.useSelectedItem({});
      return false;
    });

    return ins;
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
    if (this.settings.onlySuggestFromCustomDictionaries) {
      return this.customDictionaryService.words;
    }

    return [
      ...this.currentFileTokens
        .filter((x) => !this.customDictionaryService.wordsByValue[x])
        .map((x) => ({ value: x })),
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
    this.currentFileTokens = await this.pickTokens();

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
        console.log("debounceGetSuggestions", performance.now() - start);
      },
      this.settings.delayMilliSeconds,
      true
    );

    this.debounceClose = debounce(() => {
      this.close();
    }, this.settings.delayMilliSeconds + 50);
  }

  async refreshCustomToken(): Promise<void> {
    const start = performance.now();
    const tokens = await this.customDictionaryService.refreshCustomTokens();
    console.log("refreshCustomTokens", performance.now() - start);
    return tokens;
  }

  refreshInternalLinkTokens(): void {
    const start = performance.now();

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

    console.log("refreshInternalLinkTokens", performance.now() - start);

    this.internalLinkTokens = [
      ...resolvedInternalLinkTokens,
      ...unresolvedInternalLinkTokens,
    ];
  }

  async pickTokens(): Promise<string[]> {
    const start = performance.now();
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return [];
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return [];
    }

    const content = await this.app.vault.cachedRead(file);
    const tokens = uniq(this.tokenizer.tokenize(content));
    console.log("pickTokens", performance.now() - start);
    return tokens;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    if (this.disabled) {
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
      this.context.editor.replaceRange(
        word.value,
        this.context.start,
        this.context.end
      );
      this.close();
      this.debounceClose();
    }
  }
}
