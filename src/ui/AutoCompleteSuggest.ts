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
  normalizePath,
  Notice,
  type PluginManifest,
  Scope,
  TFile,
} from "obsidian";
import { createTokenizer, type Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import type { Settings } from "../setting/settings";
import { AppHelper } from "../app-helper";
import type { WordsByFirstLetter } from "../provider/suggester";
import { suggestionUniqPredicate } from "../provider/suggester";
import { CustomDictionaryWordProvider } from "../provider/CustomDictionaryWordProvider";
import { CurrentFileWordProvider } from "../provider/CurrentFileWordProvider";
import { InternalLinkWordProvider } from "../provider/InternalLinkWordProvider";
import { MatchStrategy } from "../provider/MatchStrategy";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { setEquals, uniqWith } from "../util/collection-helper";
import { CurrentVaultWordProvider } from "../provider/CurrentVaultWordProvider";
import type { ProviderStatusBar } from "./ProviderStatusBar";
import type { InternalLinkWord, Word } from "../model/Word";
import { DescriptionOnSuggestion } from "../option/DescriptionOnSuggestion";
import { FrontMatterWordProvider } from "../provider/FrontMatterWordProvider";
import { SpecificMatchStrategy } from "../provider/SpecificMatchStrategy";
import {
  type HitWord,
  SelectionHistoryStorage,
  type SelectionHistoryTree,
} from "../storage/SelectionHistoryStorage";
import { encodeSpace, equalsAsLiterals, isInternalLink } from "../util/strings";
import { DEFAULT_HISTORIES_PATH } from "../util/path";
import * as commands from "./popup-commands";
import type { CommandReturnType } from "./popup-commands";

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
  selectionLock = false;
  declare isOpen: boolean;

  contextStartCh: number;

  pastCurrentTokenSeparatedWhiteSpace = "";
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

  /**
   * This method update settings
   */
  async unsafeLoadHistoryData(): Promise<SelectionHistoryTree> {
    const historyPath = normalizePath(
      this.settings.intelligentSuggestionPrioritization.historyFilePath ||
        DEFAULT_HISTORIES_PATH
    );
    if (await this.appHelper.exists(historyPath)) {
      this.settings.selectionHistoryTree = {}; // TODO: Remove in the future
      return this.appHelper.loadJson<SelectionHistoryTree>(historyPath);
    }

    // TODO: Remove in the future
    if (Object.keys(this.settings.selectionHistoryTree).length > 0) {
      return this.settings.selectionHistoryTree;
    }

    return {};
  }

  static async new(
    app: App,
    manifest: PluginManifest,
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

    await ins.updateSettings(settings);
    await ins.refreshIntelligentSuggestionPrioritization();

    ins.modifyEventRef = app.vault.on("modify", async (_) => {
      await ins.refreshCurrentFileTokens();
      if (ins.selectionHistoryStorage?.shouldPersist) {
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
      new Notice(e.message);
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
                fuzzy: this.settings.fuzzyMatch
                  ? {
                      minMatchScore: this.settings.minFuzzyMatchScore,
                    }
                  : undefined,
              }
            ).map((word) => ({ ...word, offset: q.offset }));
          })
          .flat()
          .sort((a, b) => Number(a.fuzzy) - Number(b.fuzzy));

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

    this.registerHotkeys();
  }

  private registerKeyAsIgnored(modifiers: Modifier[], key: string | null) {
    this.keymapEventHandler.push(
      this.scope.register(modifiers, key, () => {
        this.close();
        return true;
      })
    );
  }

  private setHotKey(
    name: keyof Settings["hotkeys"],
    handler: (evt: KeyboardEvent) => CommandReturnType
  ) {
    this.settings.hotkeys[name].forEach((hk) => {
      this.keymapEventHandler.push(
        this.scope.register(hk.modifiers, hk.key, handler)
      );
    });
  }

  private setHotKeys(...params: Parameters<typeof this.setHotKey>[]) {
    params.forEach((args) => this.setHotKey(...args));
  }

  private registerHotkeys() {
    // Clear
    this.keymapEventHandler.forEach((x) => this.scope.unregister(x));
    this.keymapEventHandler = [];

    // Ignored
    const ipKeys = ["Enter", "Tab", "ArrowUp", "ArrowDown", "Home", "End"];
    this.scope.keys
      .filter((x) =>
        ipKeys.map((x) => x.toLowerCase()).includes((x.key ?? "").toLowerCase())
      )
      .forEach((x) => this.scope.unregister(x));
    // propagateESC
    this.scope.keys.find((x) => x.key?.toLowerCase() === "escape")!.func =
      () => {
        this.close();
        return this.settings.propagateEsc;
      };

    // Set hotkeys
    this.setHotKeys(
      ["select", (evt) => commands.select(this, evt)],
      ["up", (evt) => commands.selectPrevious(this, evt)],
      ["down", (evt) => commands.selectNext(this, evt)],
      ["select 1st", (evt) => commands.select(this, evt, 0)],
      ["select 2nd", (evt) => commands.select(this, evt, 1)],
      ["select 3rd", (evt) => commands.select(this, evt, 2)],
      ["select 4th", (evt) => commands.select(this, evt, 3)],
      ["select 5th", (evt) => commands.select(this, evt, 4)],
      ["select 6th", (evt) => commands.select(this, evt, 5)],
      ["select 7th", (evt) => commands.select(this, evt, 6)],
      ["select 8th", (evt) => commands.select(this, evt, 7)],
      ["select 9th", (evt) => commands.select(this, evt, 8)],
      ["open", (_) => commands.open(this)],
      ["completion", (_) => commands.completion(this)],
      ["insert as text", (evt) => commands.insertAsText(this, evt)]
    );

    // propagate
    ipKeys.forEach((x) => this.registerKeyAsIgnored([], x));
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

    await this.currentFileWordProvider.refreshWords({
      onlyEnglish: this.settings.onlyComplementEnglishOnCurrentFileComplement,
      minNumberOfCharacters: this.currentFileMinNumberOfCharacters,
      makeSynonymAboutEmoji: this.settings.matchingWithoutEmoji,
      makeSynonymAboutAccentsDiacritics:
        this.settings.treatAccentDiacriticsAsAlphabeticCharacters,
    });

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

    await this.currentVaultWordProvider.refreshWords({
      minNumberOfCharacters: this.currentVaultMinNumberOfCharacters,
      makeSynonymAboutEmoji: this.settings.matchingWithoutEmoji,
      makeSynonymAboutAccentsDiacritics:
        this.settings.treatAccentDiacriticsAsAlphabeticCharacters,
    });

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
      makeSynonymAboutEmoji: this.settings.matchingWithoutEmoji,
      makeSynonymAboutAccentsDiacritics:
        this.settings.treatAccentDiacriticsAsAlphabeticCharacters,
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

    this.internalLinkWordProvider.refreshWords({
      wordAsInternalLinkAlias: this.settings.suggestInternalLinkWithAlias,
      excludePathPrefixPatterns: this.excludeInternalLinkPrefixPathPatterns,
      makeSynonymAboutEmoji: this.settings.matchingWithoutEmoji,
      makeSynonymAboutAccentsDiacritics:
        this.settings.treatAccentDiacriticsAsAlphabeticCharacters,
      frontMatterKeyForExclusion:
        this.settings.frontMatterKeyForExclusionInternalLink,
    });

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

  async refreshIntelligentSuggestionPrioritization(): Promise<void> {
    // Need to migration
    if (this.settings.intelligentSuggestionPrioritization.enabled) {
      this.selectionHistoryStorage = new SelectionHistoryStorage(
        await this.unsafeLoadHistoryData(),
        this.settings.intelligentSuggestionPrioritization.maxDaysToKeepHistory,
        this.settings.intelligentSuggestionPrioritization.maxNumberOfHistoryToKeep
      );
      this.selectionHistoryStorage.purge();
    } else {
      this.selectionHistoryStorage = undefined;
    }
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
    editor: Editor
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

    const currentFrontMatter = this.settings.enableFrontMatterComplement
      ? this.appHelper.getCurrentFrontMatter()
      : undefined;
    showDebugLog(`Current front matter is ${currentFrontMatter}`);

    const cl = this.appHelper.getCurrentLine(editor);
    if (
      equalsAsLiterals(this.previousCurrentLine, cl) &&
      !this.runManually &&
      !currentFrontMatter
    ) {
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
    let currentTokens = tokenized.slice(
      tokenized.length > this.settings.maxNumberOfWordsAsPhrase
        ? tokenized.length - this.settings.maxNumberOfWordsAsPhrase
        : 0
    );
    showDebugLog(`currentTokens is ${JSON.stringify(currentTokens)}`);

    const currentPhrase = currentTokens.first()?.word;
    showDebugLog(`currentPhrase is ${currentPhrase}`);
    if (!currentPhrase) {
      onReturnNull(`Don't show suggestions because currentPhrase is empty`);
      return null;
    }

    const currentTokenSeparatedWhiteSpace =
      currentLineUntilCursor.split(" ").last() ?? "";
    if (
      currentTokenSeparatedWhiteSpace ===
        this.pastCurrentTokenSeparatedWhiteSpace &&
      !this.runManually
    ) {
      onReturnNull(
        `Don't show suggestions because currentTokenSeparatedWhiteSpace doesn't change`
      );
      return null;
    }
    this.pastCurrentTokenSeparatedWhiteSpace = currentTokenSeparatedWhiteSpace;
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
      currentPhrase.length === 1 &&
      Boolean(currentPhrase.match(this.tokenizer.getTrimPattern()))
    ) {
      onReturnNull(
        `Don't show suggestions because currentPhrase is TRIM_PATTERN`
      );
      return null;
    }

    if (
      !this.runManually &&
      !currentFrontMatter &&
      currentPhrase.length < this.minNumberTriggered
    ) {
      onReturnNull(
        "Don't show suggestions because currentPhrase is less than minNumberTriggered option"
      );
      return null;
    }

    if (this.runManually) {
      this.setSelectionLock(false);
    } else {
      this.setSelectionLock(this.settings.noAutoFocusUntilCycle);
    }

    showDebugLog(buildLogMessage("onTrigger", performance.now() - start));
    this.runManually = false;

    const patterns = this.settings.phrasePatternsToSuppressTrigger;
    const suppressedTokens =
      patterns.length === 0 || currentFrontMatter
        ? currentTokens
        : currentTokens.filter((t) =>
            patterns.every((p) => !new RegExp(`^${p}$`).test(t.word))
          );
    if (suppressedTokens.length === 0) {
      onReturnNull(
        `Don't show suggestions because all tokens are ignored by token pattern: ${String.raw`^[\u3040-\u309F\u30A0-\u30FF]{1,2}$`}`
      );
      return null;
    }

    // Hack implementation for Front matter complement
    const currentToken = currentTokens.last()!.word;
    if (currentFrontMatter && currentToken.match(/[^ ] $/)) {
      currentTokens.push({ word: "", offset: currentLineUntilCursor.length });
    }

    // For multi-word completion
    this.contextStartCh = cursor.ch - currentPhrase.length;

    return {
      start: {
        ch: cursor.ch - (currentTokens.last()?.word?.length ?? 0), // For multi-word completion
        line: cursor.line,
      },
      end: cursor,
      query: JSON.stringify({
        currentFrontMatter,
        queries: suppressedTokens.map((x) => ({
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

  constructInternalLinkText(word: InternalLinkWord): string {
    // With aliases
    if (this.settings.suggestInternalLinkWithAlias && word.aliasMeta) {
      const { link } = this.appHelper.optimizeMarkdownLinkText(
        word.aliasMeta.origin
      )!;
      return this.appHelper.useWikiLinks
        ? `[[${link}|${word.value}]]`
        : `[${word.value}](${encodeSpace(link)}.md)`;
    }

    const pattern = this.settings
      .insertAliasTransformedFromDisplayedInternalLink.enabled
      ? new RegExp(
          this.settings.insertAliasTransformedFromDisplayedInternalLink.beforeRegExp
        )
      : null;
    const match = (value: string) =>
      pattern ? Boolean(value.match(pattern)) : false;
    const replaceByPattern = (value: string) =>
      pattern
        ? value.replace(
            pattern,
            this.settings.insertAliasTransformedFromDisplayedInternalLink.after
          )
        : value;

    const { displayed, link } = this.appHelper.optimizeMarkdownLinkText(
      word.phantom ? word.value : word.createdPath
    )!;
    if (
      this.appHelper.newLinkFormat === "shortest" &&
      displayed.includes("/")
    ) {
      return this.appHelper.useWikiLinks
        ? `[[${link}|${word.value}]]`
        : `[${word.value}](${encodeSpace(link)}.md)`;
    }

    if (this.appHelper.useWikiLinks) {
      return match(link)
        ? `[[${link}|${replaceByPattern(link)}]]`
        : `[[${link}]]`;
    }

    return match(displayed)
      ? `[${replaceByPattern(displayed)}](${encodeSpace(link)}.md)`
      : `[${displayed}](${encodeSpace(link)}.md)`;
  }

  selectSuggestion(word: Word, _evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      return;
    }

    let insertedText = word.value;
    if (word.type === "internalLink") {
      insertedText = this.constructInternalLinkText(word);
    }

    if (word.type === "frontMatter") {
      if (isInternalLink(insertedText)) {
        insertedText = `"${insertedText}"`;
      }
      if (this.settings.insertCommaAfterFrontMatterCompletion) {
        insertedText = `${insertedText}, `;
      }
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
      this.appHelper.equalsAsEditorPosition(
        this.context.start,
        this.context.end
      )
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

  setSelectionLock(lock: boolean) {
    this.selectionLock = lock;
    const lockClass = "various-complements__selection-lock";

    const body = document.querySelector("body")!;
    if (lock) {
      body.addClass(lockClass);
    } else {
      body.removeClass(lockClass);
    }
  }
}
