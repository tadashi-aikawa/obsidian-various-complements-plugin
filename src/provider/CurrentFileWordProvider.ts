import { App, MarkdownView } from "obsidian";
import { groupBy, uniq } from "../util/collection-helper";
import { Word, WordsByFirstLetter } from "./suggester";
import { Tokenizer } from "../tokenizer/tokenizer";

export class CurrentFileWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter;

  constructor(private app: App, private tokenizer: Tokenizer) {}

  async refreshWords(): Promise<void> {
    this.clearWords();

    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return;
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return;
    }

    const content = await this.app.vault.cachedRead(file);
    this.words = uniq(this.tokenizer.tokenize(content)).map((x) => ({
      value: x,
    }));
    this.wordsByFirstLetter = groupBy(this.words, (x) => x.value.charAt(0));
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetter = {};
  }
}
