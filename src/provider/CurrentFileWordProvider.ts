import { App } from "obsidian";
import { groupBy, uniq } from "../util/collection-helper";
import { Word, WordsByFirstLetter } from "./suggester";
import { Tokenizer } from "../tokenizer/tokenizer";
import { AppHelper } from "../app-helper";
import { allAlphabets } from "../util/strings";

export class CurrentFileWordProvider {
  wordsByFirstLetter: WordsByFirstLetter = {};
  private words: Word[] = [];
  private tokenizer: Tokenizer;

  constructor(private app: App, private appHelper: AppHelper) {}

  async refreshWords(onlyEnglish: boolean): Promise<void> {
    this.clearWords();

    const editor = this.appHelper.getCurrentEditor();
    if (!editor) {
      return;
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return;
    }

    const currentToken = this.tokenizer
      .tokenize(
        editor.getLine(editor.getCursor().line).slice(0, editor.getCursor().ch)
      )
      .last();

    const content = await this.app.vault.cachedRead(file);
    const tokens = onlyEnglish
      ? this.tokenizer.tokenize(content).filter(allAlphabets)
      : this.tokenizer.tokenize(content);
    this.words = uniq(tokens)
      .filter((x) => x !== currentToken)
      .map((x) => ({
        value: x,
        type: "currentFile",
      }));
    this.wordsByFirstLetter = groupBy(this.words, (x) => x.value.charAt(0));
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetter = {};
  }

  get wordCount(): number {
    return this.words.length;
  }

  setSettings(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }
}
