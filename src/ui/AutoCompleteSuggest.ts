import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  MarkdownView,
  TFile,
} from "obsidian";
import { caseIncludes, lowerStartsWith } from "../util/strings";
import { createTokenizer, Tokenizer } from "../tokenizer/tokenizer";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { Settings } from "../settings";

function suggestTokens(tokens: string[], word: string, max: number) {
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

  tokens: string[] = [];
  tokenizer: Tokenizer;

  private constructor(app: App) {
    super(app);
  }

  static async new(app: App, settings: Settings): Promise<AutoCompleteSuggest> {
    const ins = new AutoCompleteSuggest(app);
    await ins.updateSettings(settings);

    app.vault.on("modify", async (_) => {
      ins.tokens = await ins.pickTokens();
    });
    app.workspace.on("active-leaf-change", async (_) => {
      ins.tokens = await ins.pickTokens();
    });

    return ins;
  }

  get tokenizerStrategy(): TokenizeStrategy {
    return TokenizeStrategy.fromName(this.settings.strategy);
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;
    this.tokenizer = createTokenizer(this.tokenizerStrategy);
    this.tokens = await this.pickTokens();
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
    const currentToken = this.tokenizer
      .tokenize(editor.getLine(cursor.line))
      .last();
    if (
      !currentToken ||
      currentToken.length < this.tokenizerStrategy.triggerThreshold
    ) {
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
    return suggestTokens(
      this.tokens,
      context.query,
      this.settings.maxNumberOfSuggestions
    );
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
    }
  }
}
