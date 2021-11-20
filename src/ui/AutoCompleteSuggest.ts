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
import { caseIncludes, lowerStartsWith } from "../util/strings";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";
import { CustomDictionaryService } from "../CustomDictionaryService";
import { uniq } from "../util/collection-helper";

function suggestTokens(tokens: string[], word: string, max: number): string[] {
  return Array.from(uniq(tokens))
    .filter((x) => x !== word)
    .filter((x) => caseIncludes(x, word))
    .sort((a, b) => a.length - b.length)
    .sort(
      (a, b) =>
        Number(lowerStartsWith(b, word)) - Number(lowerStartsWith(a, word))
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
  extends EditorSuggest<string>
  implements UnsafeEditorSuggestInterface
{
  app: App;
  settings: Settings;
  customDictionaryService: CustomDictionaryService;

  currentFileTokens: string[] = [];
  tokenizer: Tokenizer;
  debounceGetSuggestions: Debouncer<
    [EditorSuggestContext, (tokens: string[]) => void]
  >;

  disabled: boolean;

  // unsafe!!
  scope: UnsafeEditorSuggestInterface["scope"];
  suggestions: UnsafeEditorSuggestInterface["suggestions"];

  private constructor(
    app: App,
    customDictionaryService: CustomDictionaryService
  ) {
    super(app);
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

    app.vault.on("modify", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
    });
    app.workspace.on("active-leaf-change", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
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

  get tokens(): string[] {
    return this.settings.onlySuggestFromCustomDictionaries
      ? this.customDictionaryService.tokens
      : [...this.currentFileTokens, ...this.customDictionaryService.tokens];
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
      (context: EditorSuggestContext, cb: (tokens: string[]) => void) => {
        cb(
          suggestTokens(
            this.tokens,
            context.query,
            this.settings.maxNumberOfSuggestions
          )
        );
      },
      this.settings.delayMilliSeconds,
      true
    );
  }

  refreshCustomToken(): Promise<void> {
    return this.customDictionaryService.refreshCustomTokens();
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
    return this.tokenizer.tokenize(content);
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
    if (currentChar === " ") {
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

  getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
    return new Promise((resolve) => {
      this.debounceGetSuggestions(context, (tokens) => {
        resolve(tokens);
      });
    });
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    const base = createDiv();
    base.createDiv().setText(value);
    el.appendChild(base);
  }

  selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
    if (this.context) {
      this.context.editor.replaceRange(
        value,
        this.context.start,
        this.context.end
      );
      this.close();
    }
  }
}
