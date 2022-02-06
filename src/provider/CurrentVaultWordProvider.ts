import { App } from "obsidian";
import { groupBy } from "../util/collection-helper";
import { Word, WordsByFirstLetter } from "./suggester";
import { Tokenizer } from "../tokenizer/tokenizer";
import { AppHelper } from "../app-helper";

export class CurrentVaultWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter = {};

  constructor(
    private app: App,
    private appHelper: AppHelper,
    private tokenizer: Tokenizer
  ) {}

  async refreshWords(): Promise<void> {
    this.clearWords();

    const editor = this.appHelper.getCurrentEditor();
    if (!editor) {
      return;
    }

    let wordByValue: { [value: string]: Word } = {};
    for (const markdownFile of this.app.vault.getMarkdownFiles()) {
      const content = await this.app.vault.adapter.read(markdownFile.path);

      for (const token of this.tokenizer.tokenize(content)) {
        wordByValue[token] = {
          value: token,
          type: "currentVault",
          description: markdownFile.path,
        };
      }
    }

    this.words = Object.values(wordByValue);
    this.wordsByFirstLetter = groupBy(this.words, (x) => x.value.charAt(0));
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetter = {};
  }

  get wordCount(): number {
    return this.words.length;
  }
}
