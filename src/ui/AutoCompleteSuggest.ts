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
  Scope,
  TFile,
} from "obsidian";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";
import { AppHelper } from "../app-helper";
import { Word, WordsByFirstLetter } from "../provider/suggester";
import { CustomDictionaryWordProvider } from "../provider/CustomDictionaryWordProvider";
import { CurrentFileWordProvider } from "../provider/CurrentFileWordProvider";
import { InternalLinkWordProvider } from "../provider/InternalLinkWordProvider";
import { MatchStrategy } from "../provider/MatchStrategy";
import { CycleThroughSuggestionsKeys } from "../option/CycleThroughSuggestionsKeys";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { SelectSuggestionKey } from "../option/SelectSuggestionKey";
import { uniqWith } from "../util/collection-helper";
import { CurrentVaultWordProvider } from "../provider/CurrentVaultWordProvider";
import { ProviderStatusBar } from "./ProviderStatusBar";

function buildLogMessage(message: string, msec: number) {
  return `${message}: ${Math.round(msec)}[ms]`;
}

export type IndexedWords = {
  currentFile: WordsByFirstLetter;
  currentVault: WordsByFirstLetter;
  customDictionary: WordsByFirstLetter;
  internalLink: WordsByFirstLetter;
};

// This is an unsafe code..!!
interface UnsafeEditorSuggestInterface {
  scope: Scope & { keys: (KeymapEventHandler & { func: CallableFunction })[] };
  suggestions: {
    selectedItem: number;
    useSelectedItem(ev: Partial<KeyboardEvent>): void;
    setSelectedItem(selected: number, scroll: boolean): void;
  };
  isOpen: boolean;
}

export class AutoCompleteSuggest
  extends EditorSuggest<Word>
  implements UnsafeEditorSuggestInterface
{
  app: App;
  settings: Settings;
  appHelper: AppHelper;
  statusBar: ProviderStatusBar;

  currentFileWordProvider: CurrentFileWordProvider;
  currentVaultWordProvider: CurrentVaultWordProvider;
  customDictionaryWordProvider: CustomDictionaryWordProvider;
  internalLinkWordProvider: InternalLinkWordProvider;

  tokenizer: Tokenizer;
  debounceGetSuggestions: Debouncer<
    [EditorSuggestContext, (tokens: Word[]) => void]
  >;
  debounceClose: Debouncer<[]>;

  runManually: boolean;
  declare isOpen: boolean;

  contextStartCh: number;

  // unsafe!!
  scope: UnsafeEditorSuggestInterface["scope"];
  suggestions: UnsafeEditorSuggestInterface["suggestions"];

  keymapEventHandler: KeymapEventHandler[] = [];
  modifyEventRef: EventRef;
  activeLeafChangeRef: EventRef;

  private constructor(app: App, statusBar: ProviderStatusBar) {
    super(app);
    this.appHelper = new AppHelper(app);
    this.statusBar = statusBar;
  }

  triggerComplete() {
    const editor = this.appHelper.getCurrentEditor();
    const activeFile = this.app.workspace.getActiveFile();
    if (!editor || !activeFile) {
      return;
    }

    // XXX: Unsafe
    this.runManually = true;
    (this as any).trigger(editor, activeFile, true);
  }

  static async new(
    app: App,
    settings: Settings,
    statusBar: ProviderStatusBar
  ): Promise<AutoCompleteSuggest> {
    const ins = new AutoCompleteSuggest(app, statusBar);

    ins.currentFileWordProvider = new CurrentFileWordProvider(
      ins.app,
      ins.appHelper
    );
    ins.currentVaultWordProvider = new CurrentVaultWordProvider(
      ins.app,
      ins.appHelper
    );
    ins.customDictionaryWordProvider = new CustomDictionaryWordProvider(
      ins.app
    );
    ins.internalLinkWordProvider = new InternalLinkWordProvider(
      ins.app,
      ins.appHelper
    );

    await ins.updateSettings(settings);

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
    // Avoid referring to incorrect cache
    const cacheResolvedRef = app.metadataCache.on("resolved", async () => {
      ins.refreshInternalLinkTokens();
      // noinspection ES6MissingAwait
      ins.refreshCustomDictionaryTokens();
      // noinspection ES6MissingAwait
      ins.refreshCurrentVaultTokens();

      ins.app.metadataCache.offref(cacheResolvedRef);
    });

    return ins;
  }

  predictableComplete() {
    const editor = this.appHelper.getCurrentEditor();
    if (!editor) {
      return;
    }

    const cursor = editor.getCursor();
    const currentToken = this.tokenizer
      .tokenize(editor.getLine(cursor.line).slice(0, cursor.ch))
      .last();
    if (!currentToken) {
      return;
    }

    let suggestion = this.tokenizer
      .tokenize(
        editor.getRange({ line: Math.max(cursor.line - 50, 0), ch: 0 }, cursor)
      )
      .reverse()
      .slice(1)
      .find((x) => x.startsWith(currentToken));
    if (!suggestion) {
      suggestion = this.tokenizer
        .tokenize(
          editor.getRange(cursor, {
            line: Math.min(cursor.line + 50, editor.lineCount() - 1),
            ch: 0,
          })
        )
        .find((x) => x.startsWith(currentToken));
    }
    if (!suggestion) {
      return;
    }

    editor.replaceRange(
      suggestion,
      { line: cursor.line, ch: cursor.ch - currentToken.length },
      { line: cursor.line, ch: cursor.ch }
    );

    this.close();
    this.debounceClose();
  }

  unregister() {
    this.app.vault.offref(this.modifyEventRef);
    this.app.workspace.offref(this.activeLeafChangeRef);
  }

  // settings getters
  get tokenizerStrategy(): TokenizeStrategy {
    return TokenizeStrategy.fromName(this.settings.strategy);
  }

  get matchStrategy(): MatchStrategy {
    return MatchStrategy.fromName(this.settings.matchStrategy);
  }

  get minNumberTriggered(): number {
    return (
      this.settings.minNumberOfCharactersTriggered ||
      this.tokenizerStrategy.triggerThreshold
    );
  }
  // --- end ---

  get indexedWords(): IndexedWords {
    return {
      currentFile: this.currentFileWordProvider.wordsByFirstLetter,
      currentVault: this.currentVaultWordProvider.wordsByFirstLetter,
      customDictionary: this.customDictionaryWordProvider.wordsByFirstLetter,
      internalLink: this.internalLinkWordProvider.wordsByFirstLetter,
    };
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;

    this.tokenizer = createTokenizer(this.tokenizerStrategy);
    this.currentFileWordProvider.setSettings(this.tokenizer);
    this.currentVaultWordProvider.setSettings(
      this.tokenizer,
      settings.includeCurrentVaultPathPrefixPatterns
        .split("\n")
        .filter((x) => x),
      settings.excludeCurrentVaultPathPrefixPatterns
        .split("\n")
        .filter((x) => x)
    );
    this.customDictionaryWordProvider.setSettings(
      settings.customDictionaryPaths.split("\n").filter((x) => x),
      ColumnDelimiter.fromName(settings.columnDelimiter)
    );

    this.debounceGetSuggestions = debounce(
      (context: EditorSuggestContext, cb: (words: Word[]) => void) => {
        const start = performance.now();

        this.showDebugLog(() => `[context.query]: ${context.query}`);
        const queries = JSON.parse(context.query) as {
          word: string;
          offset: number;
        }[];

        const words = queries
          .filter(
            (x, i, xs) =>
              this.settings.minNumberOfWordsTriggeredPhrase + i - 1 <
                xs.length &&
              x.word.length >= this.minNumberTriggered &&
              !this.tokenizer.shouldIgnore(x.word) &&
              !x.word.endsWith(" ")
          )
          .map((q) =>
            this.matchStrategy
              .handler(
                this.indexedWords,
                q.word,
                this.settings.maxNumberOfSuggestions
              )
              .map((word) => ({ ...word, offset: q.offset }))
          )
          .flat();

        cb(
          uniqWith(
            words,
            (a, b) => a.value === b.value && a.type === b.type
          ).slice(0, this.settings.maxNumberOfSuggestions)
        );

        this.showDebugLog(() =>
          buildLogMessage("Get suggestions", performance.now() - start)
        );
      },
      this.settings.delayMilliSeconds,
      true
    );

    this.debounceClose = debounce(() => {
      this.close();
    }, this.settings.delayMilliSeconds + 50);

    this.registerKeymaps();
  }

  private registerKeymaps() {
    // Clear
    this.keymapEventHandler.forEach((x) => this.scope.unregister(x));
    this.keymapEventHandler = [];

    const cycleThroughSuggestionsKeys = CycleThroughSuggestionsKeys.fromName(
      this.settings.additionalCycleThroughSuggestionsKeys
    );
    if (cycleThroughSuggestionsKeys !== CycleThroughSuggestionsKeys.NONE) {
      this.keymapEventHandler.push(
        this.scope.register(
          cycleThroughSuggestionsKeys.nextKey.modifiers,
          cycleThroughSuggestionsKeys.nextKey.key,
          () => {
            this.suggestions.setSelectedItem(
              this.suggestions.selectedItem + 1,
              true
            );
            return false;
          }
        ),
        this.scope.register(
          cycleThroughSuggestionsKeys.previousKey.modifiers,
          cycleThroughSuggestionsKeys.previousKey.key,
          () => {
            this.suggestions.setSelectedItem(
              this.suggestions.selectedItem - 1,
              true
            );
            return false;
          }
        )
      );
    }

    this.scope.unregister(this.scope.keys.find((x) => x.key === "Enter")!);
    const selectSuggestionKey = SelectSuggestionKey.fromName(
      this.settings.selectSuggestionKeys
    );
    if (selectSuggestionKey !== SelectSuggestionKey.ENTER) {
      this.keymapEventHandler.push(
        this.scope.register(
          SelectSuggestionKey.ENTER.keyBind.modifiers,
          SelectSuggestionKey.ENTER.keyBind.key,
          () => {
            this.close();
            return true;
          }
        )
      );
    }
    if (selectSuggestionKey !== SelectSuggestionKey.TAB) {
      this.keymapEventHandler.push(
        this.scope.register(
          SelectSuggestionKey.TAB.keyBind.modifiers,
          SelectSuggestionKey.TAB.keyBind.key,
          () => {
            this.close();
            return true;
          }
        )
      );
    }
    this.keymapEventHandler.push(
      this.scope.register(
        selectSuggestionKey.keyBind.modifiers,
        selectSuggestionKey.keyBind.key,
        () => {
          this.suggestions.useSelectedItem({});
          return false;
        }
      )
    );

    this.scope.keys.find((x) => x.key === "Escape")!.func = () => {
      this.close();
      return this.settings.propagateEsc;
    };
  }

  async refreshCurrentFileTokens(): Promise<void> {
    const start = performance.now();
    this.statusBar.setCurrentFileIndexing();

    if (!this.settings.enableCurrentFileComplement) {
      this.statusBar.setCurrentFileDisabled();
      this.currentFileWordProvider.clearWords();
      this.showDebugLog(() =>
        buildLogMessage(
          "👢 Skip: Index current file tokens",
          performance.now() - start
        )
      );
      return;
    }

    await this.currentFileWordProvider.refreshWords(
      this.settings.onlyComplementEnglishOnCurrentFileComplement
    );

    this.statusBar.setCurrentFileIndexed(
      this.currentFileWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage("Index current file tokens", performance.now() - start)
    );
  }

  async refreshCurrentVaultTokens(): Promise<void> {
    const start = performance.now();
    this.statusBar.setCurrentVaultIndexing();

    if (!this.settings.enableCurrentVaultComplement) {
      this.statusBar.setCurrentVaultDisabled();
      this.currentVaultWordProvider.clearWords();
      this.showDebugLog(() =>
        buildLogMessage(
          "👢 Skip: Index current vault tokens",
          performance.now() - start
        )
      );
      return;
    }

    await this.currentVaultWordProvider.refreshWords();

    this.statusBar.setCurrentVaultIndexed(
      this.currentVaultWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage("Index current vault tokens", performance.now() - start)
    );
  }

  async refreshCustomDictionaryTokens(): Promise<void> {
    const start = performance.now();
    this.statusBar.setCustomDictionaryIndexing();

    if (!this.settings.enableCustomDictionaryComplement) {
      this.statusBar.setCustomDictionaryDisabled();
      this.customDictionaryWordProvider.clearWords();
      this.showDebugLog(() =>
        buildLogMessage(
          "👢Skip: Index custom dictionary tokens",
          performance.now() - start
        )
      );
      return;
    }

    await this.customDictionaryWordProvider.refreshCustomWords(
      this.settings.customDictionaryWordRegexPattern
    );

    this.statusBar.setCustomDictionaryIndexed(
      this.customDictionaryWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage(
        "Index custom dictionary tokens",
        performance.now() - start
      )
    );
  }

  refreshInternalLinkTokens(): void {
    const start = performance.now();
    this.statusBar.setInternalLinkIndexing();

    if (!this.settings.enableInternalLinkComplement) {
      this.statusBar.setInternalLinkDisabled();
      this.internalLinkWordProvider.clearWords();
      this.showDebugLog(() =>
        buildLogMessage(
          "👢Skip: Index internal link tokens",
          performance.now() - start
        )
      );
      return;
    }

    this.internalLinkWordProvider.refreshWords(
      this.settings.suggestInternalLinkWithAlias
    );

    this.statusBar.setInternalLinkIndexed(
      this.internalLinkWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage("Index internal link tokens", performance.now() - start)
    );
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    const start = performance.now();

    if (
      !this.settings.complementAutomatically &&
      !this.isOpen &&
      !this.runManually
    ) {
      this.showDebugLog(() => "Don't show suggestions");
      return null;
    }

    if (
      this.settings.disableSuggestionsDuringImeOn &&
      this.appHelper.isIMEOn() &&
      !this.runManually
    ) {
      this.showDebugLog(() => "Don't show suggestions for IME");
      return null;
    }

    const currentLineUntilCursor =
      this.appHelper.getCurrentLineUntilCursor(editor);
    if (currentLineUntilCursor.startsWith("---")) {
      this.showDebugLog(
        () =>
          "Don't show suggestions because it supposes front matter or horizontal line"
      );
      return null;
    }
    if (
      currentLineUntilCursor.startsWith("~~~") ||
      currentLineUntilCursor.startsWith("```")
    ) {
      this.showDebugLog(
        () => "Don't show suggestions because it supposes front code block"
      );
      return null;
    }

    const tokens = this.tokenizer.tokenize(currentLineUntilCursor, true);
    this.showDebugLog(() => `[onTrigger] tokens is ${tokens}`);

    const tokenized = this.tokenizer.recursiveTokenize(currentLineUntilCursor);
    const currentTokens = tokenized.slice(
      tokenized.length > this.settings.maxNumberOfWordsAsPhrase
        ? tokenized.length - this.settings.maxNumberOfWordsAsPhrase
        : 0
    );
    this.showDebugLog(
      () => `[onTrigger] currentTokens is ${JSON.stringify(currentTokens)}`
    );

    const currentToken = currentTokens[0]?.word;
    this.showDebugLog(() => `[onTrigger] currentToken is ${currentToken}`);
    if (!currentToken) {
      this.runManually = false;
      this.showDebugLog(
        () => `Don't show suggestions because currentToken is empty`
      );
      return null;
    }

    const currentTokenSeparatedWhiteSpace =
      currentLineUntilCursor.split(" ").last() ?? "";
    if (/^[:\/^]/.test(currentTokenSeparatedWhiteSpace)) {
      this.runManually = false;
      this.showDebugLog(
        () =>
          `Don't show suggestions for avoiding to conflict with the other commands.`
      );
      return null;
    }

    if (
      currentToken.length === 1 &&
      Boolean(currentToken.match(this.tokenizer.getTrimPattern()))
    ) {
      this.runManually = false;
      this.showDebugLog(
        () => `Don't show suggestions because currentToken is TRIM_PATTERN`
      );
      return null;
    }

    if (!this.runManually) {
      if (currentToken.length < this.minNumberTriggered) {
        this.showDebugLog(
          () =>
            "Don't show suggestions because currentToken is less than minNumberTriggered option"
        );
        return null;
      }
      if (this.tokenizer.shouldIgnore(currentToken)) {
        this.showDebugLog(
          () => "Don't show suggestions because currentToken should ignored"
        );
        return null;
      }
    }

    this.showDebugLog(() =>
      buildLogMessage("onTrigger", performance.now() - start)
    );
    this.runManually = false;

    // For multi-word completion
    this.contextStartCh = cursor.ch - currentToken.length;
    return {
      start: {
        ch: cursor.ch - (tokenized.last()?.word?.length ?? 0), // For multi-word completion
        line: cursor.line,
      },
      end: cursor,
      query: JSON.stringify(
        currentTokens.map((x) => ({
          ...x,
          offset: x.offset - currentTokens[0].offset,
        }))
      ),
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
    let text = word.value;

    base.createDiv({
      text:
        this.settings.delimiterToHideSuggestion &&
        text.includes(this.settings.delimiterToHideSuggestion)
          ? `${text.split(this.settings.delimiterToHideSuggestion)[0]} ...`
          : text,
      cls:
        word.type === "internalLink" && word.aliasMeta
          ? "various-complements__suggestion-item__content__alias"
          : undefined,
    });

    if (word.description) {
      base.createDiv({
        cls: "various-complements__suggestion-item__description",
        text: `${word.description}`,
      });
    }

    el.appendChild(base);

    el.addClass("various-complements__suggestion-item");
    switch (word.type) {
      case "currentFile":
        el.addClass("various-complements__suggestion-item__current-file");
        break;
      case "currentVault":
        el.addClass("various-complements__suggestion-item__current-vault");
        break;
      case "customDictionary":
        el.addClass("various-complements__suggestion-item__custom-dictionary");
        break;
      case "internalLink":
        el.addClass("various-complements__suggestion-item__internal-link");
        if (word.phantom) {
          el.addClass("various-complements__suggestion-item__phantom");
        }
        break;
    }
  }

  selectSuggestion(word: Word, evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      return;
    }

    let insertedText = word.value;
    if (word.type === "internalLink") {
      insertedText =
        this.settings.suggestInternalLinkWithAlias && word.aliasMeta
          ? `[[${word.aliasMeta.origin}|${word.value}]]`
          : `[[${word.value}]]`;
    }
    if (this.settings.insertAfterCompletion) {
      insertedText = `${insertedText} `;
    }
    if (this.settings.delimiterToHideSuggestion) {
      insertedText = insertedText.replace(
        this.settings.delimiterToHideSuggestion,
        ""
      );
    }

    const caret = this.settings.caretLocationSymbolAfterComplement;
    const positionToMove = caret ? insertedText.indexOf(caret) : -1;
    if (positionToMove !== -1) {
      insertedText = insertedText.replace(caret, "");
    }

    const editor = this.context.editor;
    editor.replaceRange(
      insertedText,
      {
        ...this.context.start,
        ch: this.contextStartCh + word.offset!,
      },
      this.context.end
    );

    if (positionToMove !== -1) {
      editor.setCursor(
        editor.offsetToPos(
          editor.posToOffset(editor.getCursor()) -
            insertedText.length +
            positionToMove
        )
      );
    }

    this.close();
    this.debounceClose();
  }

  private showDebugLog(toMessage: () => string) {
    if (this.settings.showLogAboutPerformanceInConsole) {
      console.log(toMessage());
    }
  }
}
