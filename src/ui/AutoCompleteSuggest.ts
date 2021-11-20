import {
  App,
  debounce,
  Debouncer,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  FileSystemAdapter,
  MarkdownView,
  Notice,
  TFile,
} from "obsidian";
import { caseIncludes, lowerStartsWith } from "../util/strings";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";

function suggestTokens(tokens: string[], word: string, max: number): string[] {
  return Array.from(new Set(tokens))
    .filter((x) => x !== word)
    .filter((x) => caseIncludes(x, word))
    .sort((a, b) => a.length - b.length)
    .sort(
      (a, b) =>
        Number(lowerStartsWith(b, word)) - Number(lowerStartsWith(a, word))
    )
    .slice(0, max);
}

export class AutoCompleteSuggest extends EditorSuggest<string> {
  app: App;
  settings: Settings;

  currentFileTokens: string[] = [];
  customTokens: string[] = [];
  tokenizer: Tokenizer;
  debounceGetSuggestions: Debouncer<
    [EditorSuggestContext, (tokens: string[]) => void]
  >;

  disabled: boolean;

  private constructor(app: App) {
    super(app);
  }

  static async new(app: App, settings: Settings): Promise<AutoCompleteSuggest> {
    const ins = new AutoCompleteSuggest(app);
    await ins.updateSettings(settings);
    await ins.refreshCustomTokens();

    app.vault.on("modify", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
    });
    app.workspace.on("active-leaf-change", async (_) => {
      ins.currentFileTokens = await ins.pickTokens();
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
    return [...this.currentFileTokens, ...this.customTokens];
  }

  toggleEnabled(): void {
    this.disabled = !this.disabled;
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;

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

  async refreshCustomTokens() {
    this.customTokens = [];
    const paths = this.settings.customDictionaryPaths
      .split("\n")
      .filter((x) => x);
    for (const path of paths) {
      try {
        const buf = await FileSystemAdapter.readLocalFile(path);
        const str = new TextDecoder().decode(buf);
        this.customTokens.push(
          ...str.split(/(\r\n|\n)/).filter((x) => x !== "")
        );
      } catch {
        // noinspection ObjectAllocationIgnored
        new Notice(`⚠ Fail to load ${path} -- Various Complements Plugin`);
      }
    }
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
