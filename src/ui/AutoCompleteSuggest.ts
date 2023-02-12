import {
  App,
  debounce,
  type Debouncer,
  Editor,
  type EditorPosition,
  EditorSuggest,
  type EditorSuggestContext,
  type EditorSuggestTriggerInfo,
  type EventRef,
  type KeymapEventHandler,
  type Modifier,
  Notice,
  Scope,
  TFile,
} from "obsidian";
import { createTokenizer, type Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import type { Settings } from "../setting/settings";
import { AppHelper } from "../app-helper";
import type { WordsByFirstLetter } from "../provider/suggester";
import { CustomDictionaryWordProvider } from "../provider/CustomDictionaryWordProvider";
import { CurrentFileWordProvider } from "../provider/CurrentFileWordProvider";
import { InternalLinkWordProvider } from "../provider/InternalLinkWordProvider";
import { MatchStrategy } from "../provider/MatchStrategy";
import { CycleThroughSuggestionsKeys } from "../option/CycleThroughSuggestionsKeys";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { SelectSuggestionKey } from "../option/SelectSuggestionKey";
import { setEquals, uniqWith } from "../util/collection-helper";
import { CurrentVaultWordProvider } from "../provider/CurrentVaultWordProvider";
import type { ProviderStatusBar } from "./ProviderStatusBar";
import type { Word } from "../model/Word";
import { OpenSourceFileKeys } from "../option/OpenSourceFileKeys";
import { DescriptionOnSuggestion } from "../option/DescriptionOnSuggestion";
import { FrontMatterWordProvider } from "../provider/FrontMatterWordProvider";
import { SpecificMatchStrategy } from "../provider/SpecificMatchStrategy";
import {
  type HitWord,
  SelectionHistoryStorage,
} from "../storage/SelectionHistoryStorage";
import { suggestionUniqPredicate } from "../provider/suggester";
import { encodeSpace, excludeEmoji, findCommonPrefix } from "../util/strings";

function buildLogMessage(message: string, msec: number) {
  return `${message}: ${Math.round(msec)}[ms]`;
}

export type IndexedWords = {
  currentFile: WordsByFirstLetter;
  currentVault: WordsByFirstLetter;
  customDictionary: WordsByFirstLetter;
  internalLink: WordsByFirstLetter;
  frontMatter: { [key: string]: WordsByFirstLetter };
};

// This is an unsafe code..!!
interface UnsafeEditorSuggestInterface {
  scope: Scope & { keys: (KeymapEventHandler & { func: CallableFunction })[] };
  suggestions: {
    selectedItem: number;
    useSelectedItem(ev: Partial<KeyboardEvent>): void;
    setSelectedItem(selected: number, event: KeyboardEvent): void;
    values: Word[];
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
  frontMatterWordProvider: FrontMatterWordProvider;
  selectionHistoryStorage: SelectionHistoryStorage | undefined;

  tokenizer: Tokenizer;
  debounceGetSuggestions: Debouncer<
    [EditorSuggestContext, (tokens: Word[]) => void],
    void
  >;
  debounceClose: Debouncer<[], void>;

  runManually: boolean;
  declare isOpen: boolean;

  contextStartCh: number;

  previousCurrentLine = "";
  previousLinksCacheInActiveFile: Set<string> = new Set();

  // unsafe!!
  scope: UnsafeEditorSuggestInterface["scope"];
  suggestions: UnsafeEditorSuggestInterface["suggestions"];

  keymapEventHandler: KeymapEventHandler[] = [];
  modifyEventRef: EventRef;
  activeLeafChangeRef: EventRef;
  metadataCacheChangeRef: EventRef;

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

  hideCompletion() {
    this.close();
  }

  static async new(
    app: App,
    settings: Settings,
    statusBar: ProviderStatusBar,
    onPersistSelectionHistory: () => void
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
      ins.app,
      ins.appHelper
    );
    ins.internalLinkWordProvider = new InternalLinkWordProvider(
      ins.app,
      ins.appHelper
    );
    ins.frontMatterWordProvider = new FrontMatterWordProvider(
      ins.app,
      ins.appHelper
    );

    ins.selectionHistoryStorage = new SelectionHistoryStorage(
      settings.selectionHistoryTree,
      settings.intelligentSuggestionPrioritization.maxDaysToKeepHistory,
      settings.intelligentSuggestionPrioritization.maxNumberOfHistoryToKeep
    );
    ins.selectionHistoryStorage.purge();

    await ins.updateSettings(settings);

    ins.modifyEventRef = app.vault.on("modify", async (_) => {
      await ins.refreshCurrentFileTokens();
      if (ins.selectionHistoryStorage?.shouldPersist) {
        ins.settings.selectionHistoryTree = ins.selectionHistoryStorage.data;
        ins.selectionHistoryStorage.syncPersistVersion();
        onPersistSelectionHistory();
      }
    });
    ins.activeLeafChangeRef = app.workspace.on(
      "active-leaf-change",
      async (_) => {
        await ins.refreshCurrentFileTokens();
        ins.refreshInternalLinkTokens();
        ins.updateFrontMatterToken();
      }
    );

    ins.metadataCacheChangeRef = app.metadataCache.on("changed", async (f) => {
      ins.updateFrontMatterTokenIndex(f);
      if (!ins.appHelper.isActiveFile(f)) {
        ins.updateFrontMatterToken();
      }
      if (settings.updateInternalLinksOnSave) {
        await sleep(50); // Wait for cache updated
        const currentCache = ins.appHelper.getUnresolvedLinks(f);
        if (!setEquals(ins.previousLinksCacheInActiveFile, currentCache)) {
          console.log("refresh");
          ins.refreshInternalLinkTokens();
          ins.previousLinksCacheInActiveFile = currentCache;
        }
      }
    });

    // Avoid referring to incorrect cache
    const cacheResolvedRef = app.metadataCache.on("resolved", async () => {
      ins.refreshInternalLinkTokens();
      ins.refreshFrontMatterTokens();
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
    this.app.metadataCache.offref(this.metadataCacheChangeRef);
  }

  // settings getters
  get tokenizerStrategy(): TokenizeStrategy {
    return TokenizeStrategy.fromName(this.settings.strategy);
  }

  get matchStrategy(): MatchStrategy {
    return MatchStrategy.fromName(this.settings.matchStrategy);
  }

  get frontMatterComplementStrategy(): SpecificMatchStrategy {
    return SpecificMatchStrategy.fromName(
      this.settings.frontMatterComplementMatchStrategy
    );
  }

  get minNumberTriggered(): number {
    return (
      this.settings.minNumberOfCharactersTriggered ||
      this.tokenizerStrategy.triggerThreshold
    );
  }

  get currentFileMinNumberOfCharacters(): number {
    return (
      this.settings.currentFileMinNumberOfCharacters ||
      this.tokenizerStrategy.indexingThreshold
    );
  }

  get currentVaultMinNumberOfCharacters(): number {
    return (
      this.settings.currentVaultMinNumberOfCharacters ||
      this.tokenizerStrategy.indexingThreshold
    );
  }

  get descriptionOnSuggestion(): DescriptionOnSuggestion {
    return DescriptionOnSuggestion.fromName(
      this.settings.descriptionOnSuggestion
    );
  }

  get excludeInternalLinkPrefixPathPatterns(): string[] {
    return this.settings.excludeInternalLinkPathPrefixPatterns
      .split("\n")
      .filter((x) => x);
  }

  // --- end ---

  get indexedWords(): IndexedWords {
    return {
      currentFile: this.currentFileWordProvider.wordsByFirstLetter,
      currentVault: this.currentVaultWordProvider.wordsByFirstLetter,
      customDictionary: this.customDictionaryWordProvider.wordsByFirstLetter,
      internalLink: this.internalLinkWordProvider.wordsByFirstLetter,
      frontMatter: this.frontMatterWordProvider.wordsByFirstLetterByKey,
    };
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;

    this.statusBar.setMatchStrategy(this.matchStrategy);
    this.statusBar.setComplementAutomatically(
      this.settings.complementAutomatically
    );

    try {
      this.tokenizer = await createTokenizer(
        this.tokenizerStrategy,
        this.app,
        this.settings
      );
    } catch (e: any) {
      new Notice(e.message, 0);
    }
    this.currentFileWordProvider.setSettings(this.tokenizer);
    this.currentVaultWordProvider.setSettings(
      this.tokenizer,
      settings.includeCurrentVaultPathPrefixPatterns
        .split("\n")
        .filter((x) => x),
      settings.excludeCurrentVaultPathPrefixPatterns
        .split("\n")
        .filter((x) => x),
      settings.includeCurrentVaultOnlyFilesUnderCurrentDirectory
    );
    this.customDictionaryWordProvider.setSettings(
      settings.customDictionaryPaths.split("\n").filter((x) => x),
      ColumnDelimiter.fromName(settings.columnDelimiter),
      settings.delimiterToDivideSuggestionsForDisplayFromInsertion || null
    );

    this.debounceGetSuggestions = debounce(
      (context: EditorSuggestContext, cb: (words: Word[]) => void) => {
        const start = performance.now();

        this.showDebugLog(() => `[context.query]: ${context.query}`);
        const parsedQuery = JSON.parse(context.query) as {
          currentFrontMatter?: string;
          queries: {
            word: string;
            offset: number;
          }[];
        };

        const words = parsedQuery.queries
          .filter(
            (x, i, xs) =>
              parsedQuery.currentFrontMatter ||
              (this.settings.minNumberOfWordsTriggeredPhrase + i - 1 <
                xs.length &&
                x.word.length >= this.minNumberTriggered &&
                !x.word.endsWith(" "))
          )
          .map((q) => {
            const handler =
              parsedQuery.currentFrontMatter &&
              this.frontMatterComplementStrategy !==
                SpecificMatchStrategy.INHERIT
                ? this.frontMatterComplementStrategy.handler
                : this.matchStrategy.handler;
            return handler(
              this.indexedWords,
              q.word,
              this.settings.maxNumberOfSuggestions,
              {
                frontMatter: parsedQuery.currentFrontMatter,
                selectionHistoryStorage: this.selectionHistoryStorage,
              }
            ).map((word) => ({ ...word, offset: q.offset }));
          })
          .flat();

        cb(
          uniqWith(words, suggestionUniqPredicate).slice(
            0,
            this.settings.maxNumberOfSuggestions
          )
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
    const registerKeyAsIgnored = (
      modifiers: Modifier[],
      key: string | null
    ) => {
      this.keymapEventHandler.push(
        this.scope.register(modifiers, key, () => {
          this.close();
          return true;
        })
      );
    };

    // Clear
    this.keymapEventHandler.forEach((x) => this.scope.unregister(x));
    this.keymapEventHandler = [];
    this.scope.unregister(this.scope.keys.find((x) => x.key === "Enter")!);
    this.scope.unregister(this.scope.keys.find((x) => x.key === "ArrowUp")!);
    this.scope.unregister(this.scope.keys.find((x) => x.key === "ArrowDown")!);

    // selectSuggestionKeys
    const selectSuggestionKey = SelectSuggestionKey.fromName(
      this.settings.selectSuggestionKeys
    );
    if (selectSuggestionKey !== SelectSuggestionKey.ENTER) {
      registerKeyAsIgnored(
        SelectSuggestionKey.ENTER.keyBind.modifiers,
        SelectSuggestionKey.ENTER.keyBind.key
      );
    }
    if (selectSuggestionKey !== SelectSuggestionKey.TAB) {
      registerKeyAsIgnored(
        SelectSuggestionKey.TAB.keyBind.modifiers,
        SelectSuggestionKey.TAB.keyBind.key
      );
    }
    if (selectSuggestionKey !== SelectSuggestionKey.None) {
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
    }

    // propagateESC
    this.scope.keys.find((x) => x.key === "Escape")!.func = () => {
      this.close();
      return this.settings.propagateEsc;
    };

    // cycleThroughSuggestionsKeys
    const selectNext = (evt: KeyboardEvent) => {
      this.suggestions.setSelectedItem(this.suggestions.selectedItem + 1, evt);
      return false;
    };
    const selectPrevious = (evt: KeyboardEvent) => {
      this.suggestions.setSelectedItem(this.suggestions.selectedItem - 1, evt);
      return false;
    };

    const cycleThroughSuggestionsKeys = CycleThroughSuggestionsKeys.fromName(
      this.settings.additionalCycleThroughSuggestionsKeys
    );
    if (this.settings.disableUpDownKeysForCycleThroughSuggestionsKeys) {
      this.keymapEventHandler.push(
        this.scope.register([], "ArrowDown", () => {
          this.close();
          return true;
        }),
        this.scope.register([], "ArrowUp", () => {
          this.close();
          return true;
        })
      );
    } else {
      this.keymapEventHandler.push(
        this.scope.register([], "ArrowDown", selectNext),
        this.scope.register([], "ArrowUp", selectPrevious)
      );
    }
    if (cycleThroughSuggestionsKeys !== CycleThroughSuggestionsKeys.NONE) {
      if (cycleThroughSuggestionsKeys === CycleThroughSuggestionsKeys.TAB) {
        this.scope.unregister(
          this.scope.keys.find((x) => x.modifiers === "" && x.key === "Tab")!
        );
      }
      this.keymapEventHandler.push(
        this.scope.register(
          cycleThroughSuggestionsKeys.nextKey.modifiers,
          cycleThroughSuggestionsKeys.nextKey.key,
          selectNext
        ),
        this.scope.register(
          cycleThroughSuggestionsKeys.previousKey.modifiers,
          cycleThroughSuggestionsKeys.previousKey.key,
          selectPrevious
        )
      );
    }

    const openSourceFileKey = OpenSourceFileKeys.fromName(
      this.settings.openSourceFileKey
    );
    if (openSourceFileKey !== OpenSourceFileKeys.NONE) {
      this.keymapEventHandler.push(
        this.scope.register(
          openSourceFileKey.keyBind.modifiers,
          openSourceFileKey.keyBind.key,
          () => {
            const item = this.suggestions.values[this.suggestions.selectedItem];
            if (
              item.type !== "currentVault" &&
              item.type !== "internalLink" &&
              item.type !== "frontMatter"
            ) {
              return false;
            }

            const markdownFile = this.appHelper.getMarkdownFileByPath(
              item.createdPath
            );
            if (!markdownFile) {
              // noinspection ObjectAllocationIgnored
              new Notice(`Can't open ${item.createdPath}`);
              return false;
            }
            this.appHelper.openMarkdownFile(markdownFile, true);
            return false;
          }
        )
      );
    }

    if (this.settings.useCommonPrefixCompletionOfSuggestion) {
      this.scope.unregister(
        this.scope.keys.find((x) => x.modifiers === "" && x.key === "Tab")!
      );
      this.keymapEventHandler.push(
        this.scope.register([], "Tab", () => {
          if (!this.context) {
            return;
          }

          const editor = this.context.editor;
          const currentPhrase = editor.getRange(
            {
              ...this.context.start,
              ch: this.contextStartCh,
            },
            this.context.end
          );

          const tokens = this.tokenizer.recursiveTokenize(currentPhrase);
          const commonPrefixWithToken = tokens
            .map((t) => ({
              token: t,
              commonPrefix: findCommonPrefix(
                this.suggestions.values
                  .map((x) => excludeEmoji(x.value))
                  .filter((x) =>
                    x.toLowerCase().startsWith(t.word.toLowerCase())
                  )
              ),
            }))
            .find((x) => x.commonPrefix != null);

          if (
            !commonPrefixWithToken ||
            currentPhrase === commonPrefixWithToken.commonPrefix
          ) {
            return false;
          }

          editor.replaceRange(
            commonPrefixWithToken.commonPrefix!,
            {
              ...this.context.start,
              ch: this.contextStartCh + commonPrefixWithToken.token.offset,
            },
            this.context.end
          );
          return true;
        })
      );
    }
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
      this.settings.onlyComplementEnglishOnCurrentFileComplement,
      this.currentFileMinNumberOfCharacters
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

    await this.currentVaultWordProvider.refreshWords(
      this.currentVaultMinNumberOfCharacters
    );

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

    await this.customDictionaryWordProvider.refreshCustomWords({
      regexp: this.settings.customDictionaryWordRegexPattern,
      delimiterForHide: this.settings.delimiterToHideSuggestion || undefined,
      delimiterForDisplay:
        this.settings.delimiterToDivideSuggestionsForDisplayFromInsertion ||
        undefined,
      caretSymbol:
        this.settings.caretLocationSymbolAfterComplement || undefined,
    });

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
      this.settings.suggestInternalLinkWithAlias,
      this.excludeInternalLinkPrefixPathPatterns
    );

    this.statusBar.setInternalLinkIndexed(
      this.internalLinkWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage("Index internal link tokens", performance.now() - start)
    );
  }

  refreshFrontMatterTokens(): void {
    const start = performance.now();
    this.statusBar.setFrontMatterIndexing();

    if (!this.settings.enableFrontMatterComplement) {
      this.statusBar.setFrontMatterDisabled();
      this.frontMatterWordProvider.clearWords();
      this.showDebugLog(() =>
        buildLogMessage(
          "👢Skip: Index front matter tokens",
          performance.now() - start
        )
      );
      return;
    }

    this.frontMatterWordProvider.refreshWords();

    this.statusBar.setFrontMatterIndexed(
      this.frontMatterWordProvider.wordCount
    );
    this.showDebugLog(() =>
      buildLogMessage("Index front matter tokens", performance.now() - start)
    );
  }

  updateFrontMatterTokenIndex(file: TFile): void {
    const start = performance.now();
    if (!this.settings.enableFrontMatterComplement) {
      this.showDebugLog(() =>
        buildLogMessage(
          "👢Skip: Update front matter token index",
          performance.now() - start
        )
      );
      return;
    }

    this.frontMatterWordProvider.updateWordIndex(file);

    this.showDebugLog(() =>
      buildLogMessage(
        "Update front matter token index",
        performance.now() - start
      )
    );
  }

  updateFrontMatterToken(): void {
    const start = performance.now();
    if (!this.settings.enableFrontMatterComplement) {
      this.showDebugLog(() =>
        buildLogMessage(
          "👢Skip: Update front matter token",
          performance.now() - start
        )
      );
      return;
    }

    this.frontMatterWordProvider.updateWords();
    this.statusBar.setFrontMatterIndexed(
      this.frontMatterWordProvider.wordCount
    );

    this.showDebugLog(() =>
      buildLogMessage("Update front matter token", performance.now() - start)
    );
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo | null {
    const start = performance.now();

    const showDebugLog = (message: string) => {
      this.showDebugLog(() => `[onTrigger] ${message}`);
    };
    const onReturnNull = (message: string) => {
      showDebugLog(message);
      this.runManually = false;
      this.close();
    };

    if (
      !this.settings.complementAutomatically &&
      !this.isOpen &&
      !this.runManually
    ) {
      onReturnNull("Don't show suggestions");
      return null;
    }

    if (
      this.settings.disableSuggestionsDuringImeOn &&
      this.appHelper.isIMEOn() &&
      !this.runManually
    ) {
      onReturnNull("Don't show suggestions for IME");
      return null;
    }

    const cl = this.appHelper.getCurrentLine(editor);
    if (this.previousCurrentLine === cl && !this.runManually) {
      this.previousCurrentLine = cl;
      onReturnNull("Don't show suggestions because there are no changes");
      return null;
    }
    this.previousCurrentLine = cl;

    const currentLineUntilCursor =
      this.appHelper.getCurrentLineUntilCursor(editor);
    if (currentLineUntilCursor.startsWith("---")) {
      onReturnNull(
        "Don't show suggestions because it supposes front matter or horizontal line"
      );
      return null;
    }
    const suppressedPattern = this.settings.patternsToSuppressTrigger.find(
      (p) => new RegExp(p).test(currentLineUntilCursor)
    );
    if (suppressedPattern) {
      onReturnNull(
        `Don't show suggestions because it is the ignored pattern: ${suppressedPattern}`
      );
      return null;
    }

    const tokens = this.tokenizer.tokenize(currentLineUntilCursor, true);
    showDebugLog(`tokens is ${tokens}`);

    const tokenized = this.tokenizer.recursiveTokenize(currentLineUntilCursor);
    const currentTokens = tokenized.slice(
      tokenized.length > this.settings.maxNumberOfWordsAsPhrase
        ? tokenized.length - this.settings.maxNumberOfWordsAsPhrase
        : 0
    );
    showDebugLog(`currentTokens is ${JSON.stringify(currentTokens)}`);

    const currentToken = currentTokens[0]?.word;
    showDebugLog(`currentToken is ${currentToken}`);
    if (!currentToken) {
      onReturnNull(`Don't show suggestions because currentToken is empty`);
      return null;
    }

    const currentTokenSeparatedWhiteSpace =
      currentLineUntilCursor.split(" ").last() ?? "";
    if (
      new RegExp(`^[${this.settings.firstCharactersDisableSuggestions}]`).test(
        currentTokenSeparatedWhiteSpace
      )
    ) {
      onReturnNull(
        `Don't show suggestions for avoiding to conflict with the other commands.`
      );
      return null;
    }

    if (
      currentToken.length === 1 &&
      Boolean(currentToken.match(this.tokenizer.getTrimPattern()))
    ) {
      onReturnNull(
        `Don't show suggestions because currentToken is TRIM_PATTERN`
      );
      return null;
    }

    const currentFrontMatter = this.settings.enableFrontMatterComplement
      ? this.appHelper.getCurrentFrontMatter()
      : undefined;
    showDebugLog(`Current front matter is ${currentFrontMatter}`);

    if (
      !this.runManually &&
      !currentFrontMatter &&
      currentToken.length < this.minNumberTriggered
    ) {
      onReturnNull(
        "Don't show suggestions because currentToken is less than minNumberTriggered option"
      );
      return null;
    }

    showDebugLog(buildLogMessage("onTrigger", performance.now() - start));
    this.runManually = false;

    // Hack implementation for Front matter complement
    if (currentFrontMatter && currentTokens.last()?.word.match(/[^ ] $/)) {
      currentTokens.push({ word: "", offset: currentLineUntilCursor.length });
    }

    // For multi-word completion
    this.contextStartCh = cursor.ch - currentToken.length;
    return {
      start: {
        ch: cursor.ch - (currentTokens.last()?.word?.length ?? 0), // For multi-word completion
        line: cursor.line,
      },
      end: cursor,
      query: JSON.stringify({
        currentFrontMatter,
        queries: currentTokens.map((x) => ({
          ...x,
          offset: x.offset - currentTokens[0].offset,
        })),
      }),
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
    if (
      word.type === "customDictionary" &&
      word.insertedText &&
      this.settings.displayedTextSuffix
    ) {
      text += this.settings.displayedTextSuffix;
    }

    base.createDiv({
      text,
      cls:
        word.type === "internalLink" && word.aliasMeta
          ? "various-complements__suggestion-item__content__alias"
          : undefined,
    });

    const description = this.descriptionOnSuggestion.toDisplay(word);
    if (description) {
      base.createDiv({
        cls: "various-complements__suggestion-item__description",
        text: `${description}`,
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
      case "frontMatter":
        el.addClass("various-complements__suggestion-item__front-matter");
        break;
    }
  }

  selectSuggestion(word: Word, evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      return;
    }

    let insertedText = word.value;
    if (word.type === "internalLink") {
      if (this.settings.suggestInternalLinkWithAlias && word.aliasMeta) {
        const { link } = this.appHelper.optimizeMarkdownLinkText(
          word.aliasMeta.origin
        )!;
        insertedText = this.appHelper.useWikiLinks
          ? `[[${link}|${word.value}]]`
          : `[${word.value}](${encodeSpace(link)}.md)`;
      } else {
        const { displayed, link } = this.appHelper.optimizeMarkdownLinkText(
          word.phantom ? word.value : word.createdPath
        )!;
        if (
          this.appHelper.newLinkFormat === "shortest" &&
          displayed.includes("/")
        ) {
          insertedText = this.appHelper.useWikiLinks
            ? `[[${link}|${word.value}]]`
            : `[${word.value}](${encodeSpace(link)}.md)`;
        } else {
          insertedText = this.appHelper.useWikiLinks
            ? `[[${link}]]`
            : `[${displayed}](${encodeSpace(link)}.md)`;
        }
      }
    }

    if (
      word.type === "frontMatter" &&
      this.settings.insertCommaAfterFrontMatterCompletion
    ) {
      insertedText = `${insertedText}, `;
    } else {
      if (
        this.settings.insertAfterCompletion &&
        !(word.type === "customDictionary" && word.ignoreSpaceAfterCompletion)
      ) {
        insertedText = `${insertedText} `;
      }
    }

    let positionToMove = -1;

    if (word.type === "customDictionary") {
      if (word.insertedText) {
        insertedText = word.insertedText;
      }

      const caret = word.caretSymbol;
      if (caret) {
        positionToMove = insertedText.indexOf(caret);
        insertedText = insertedText.replace(caret, "");
      }
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

    // The workaround of strange behavior for that cursor doesn't move after completion only if it doesn't input any word.
    if (
      this.appHelper.equalsAsEditorPostion(this.context.start, this.context.end)
    ) {
      editor.setCursor(
        editor.offsetToPos(
          editor.posToOffset(editor.getCursor()) + insertedText.length
        )
      );
    }

    this.selectionHistoryStorage?.increment(word as HitWord);
    if (this.settings.showLogAboutPerformanceInConsole) {
      console.log("--- history ---");
      console.log(this.selectionHistoryStorage?.data);
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
