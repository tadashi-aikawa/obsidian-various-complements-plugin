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
import { CycleThroughSuggestionsKeys } from "../CycleThroughSuggestionsKeys";

export type IndexedWords = {
  currentFile: WordsByFirstLetter;
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
}

export class AutoCompleteSuggest
  extends EditorSuggest<Word>
  implements UnsafeEditorSuggestInterface
{
  app: App;
  settings: Settings;
  appHelper: AppHelper;

  currentFileWordProvider: CurrentFileWordProvider;
  customDictionaryWordProvider: CustomDictionaryWordProvider;
  internalLinkWordProvider: InternalLinkWordProvider;

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
    customDictionarySuggester: CustomDictionaryWordProvider
  ) {
    super(app);
    this.appHelper = new AppHelper(app);
    this.customDictionaryWordProvider = customDictionarySuggester;
  }

  triggerComplete() {
    const editor = this.appHelper.getCurrentEditor();
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
      new CustomDictionaryWordProvider(
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

  get indexedWords(): IndexedWords {
    return {
      currentFile: this.currentFileWordProvider.wordsByFirstLetter,
      customDictionary: this.customDictionaryWordProvider.wordsByFirstLetter,
      internalLink: this.internalLinkWordProvider.wordsByFirstLetter,
    };
  }

  toggleEnabled(): void {
    this.disabled = !this.disabled;
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;
    this.customDictionaryWordProvider.updatePaths(
      settings.customDictionaryPaths.split("\n").filter((x) => x)
    );
    this.tokenizer = createTokenizer(this.tokenizerStrategy);
    this.currentFileWordProvider = new CurrentFileWordProvider(
      this.app,
      this.appHelper,
      this.tokenizer
    );
    await this.refreshCurrentFileTokens();
    this.internalLinkWordProvider = new InternalLinkWordProvider(
      this.app,
      this.appHelper
    );
    await this.refreshInternalLinkTokens();

    this.debounceGetSuggestions = debounce(
      (context: EditorSuggestContext, cb: (words: Word[]) => void) => {
        const start = performance.now();
        cb(
          this.matchStrategy.handler(
            this.indexedWords,
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

    this.registerKeymaps();
  }

  private registerKeymaps() {
    // Clear
    this.keymapEventHandler.forEach((x) => this.scope.unregister(x));
    this.keymapEventHandler = [];

    // Cycle throw suggestions keys
    const keys = CycleThroughSuggestionsKeys.fromName(
      this.settings.additionalCycleThroughSuggestionsKeys
    );
    if (keys !== CycleThroughSuggestionsKeys.NONE) {
      this.keymapEventHandler.push(
        this.scope.register(keys.nextKey.modifiers, keys.nextKey.key, () => {
          this.suggestions.setSelectedItem(
            this.suggestions.selectedItem + 1,
            true
          );
          return false;
        }),
        this.scope.register(
          keys.previousKey.modifiers,
          keys.previousKey.key,
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

    // Ignore if additionalCycleThroughSuggestionsKeys uses
    this.keymapEventHandler.push(
      this.scope.register([], "Tab", () => {
        this.suggestions.useSelectedItem({});
        return false;
      })
    );

    // overwrite
    this.scope.keys.find((x) => x.key === "Escape")!.func = () => {
      this.close();
      return this.settings.propagateEsc;
    };
  }

  async refreshCurrentFileTokens(): Promise<void> {
    const start = performance.now();

    if (!this.settings.enableCurrentFileComplement) {
      this.currentFileWordProvider.clearWords();
      this.showDebugLog(
        "👢 Skip: Index current file tokens",
        performance.now() - start
      );
      return;
    }

    await this.currentFileWordProvider.refreshWords(
      this.settings.onlyComplementEnglishOnCurrentFileComplement
    );
    this.showDebugLog("Index current file tokens", performance.now() - start);
  }

  async refreshCustomDictionaryTokens(): Promise<void> {
    const start = performance.now();

    if (!this.settings.enableCustomDictionaryComplement) {
      this.customDictionaryWordProvider.clearWords();
      this.showDebugLog(
        "👢Skip: Index custom dictionary tokens",
        performance.now() - start
      );
      return;
    }

    await this.customDictionaryWordProvider.refreshCustomWords();
    this.showDebugLog(
      "Index custom dictionary tokens",
      performance.now() - start
    );
  }

  refreshInternalLinkTokens(): void {
    const start = performance.now();

    if (!this.settings.enableInternalLinkComplement) {
      this.internalLinkWordProvider.clearWords();
      this.showDebugLog(
        "👢Skip: Index internal link tokens",
        performance.now() - start
      );
      return;
    }

    this.internalLinkWordProvider.refreshWords();
    this.showDebugLog("Index internal link tokens", performance.now() - start);
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
    const text = word.internalLink ? `[[${word.value}]]` : word.value;
    base.createDiv({
      text:
        this.settings.delimiterToHideSuggestion &&
        text.includes(this.settings.delimiterToHideSuggestion)
          ? `${text.split(this.settings.delimiterToHideSuggestion)[0]} ...`
          : text,
    });

    if (word.description) {
      base.createDiv({
        cls: "various-complements__suggest__description",
        text: `${word.description}`,
      });
    }

    el.appendChild(base);
  }

  selectSuggestion(word: Word, evt: MouseEvent | KeyboardEvent): void {
    if (this.context) {
      let insertedText = word.value;
      if (word.internalLink) {
        insertedText = `[[${insertedText}]]`;
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
      insertedText = insertedText.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

      const caret = this.settings.caretLocationSymbolAfterComplement;
      const positionToMove = caret ? insertedText.indexOf(caret) : -1;
      if (positionToMove !== -1) {
        insertedText = insertedText.replace("<CARET>", "");
      }

      const editor = this.context.editor;
      editor.replaceRange(insertedText, this.context.start, this.context.end);

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
  }

  private showDebugLog(message: string, msec: number) {
    if (this.settings.showLogAboutPerformanceInConsole) {
      console.log(`${message}: ${Math.round(msec)}[ms]`);
    }
  }
}
