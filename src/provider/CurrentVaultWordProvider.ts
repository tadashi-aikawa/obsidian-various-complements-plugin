import { App } from "obsidian";
import { groupBy } from "../util/collection-helper";
import { WordsByFirstLetter } from "./suggester";
import { Tokenizer } from "../tokenizer/tokenizer";
import { AppHelper } from "../app-helper";
import { Word } from "../model/Word";

export class CurrentVaultWordProvider {
  wordsByFirstLetter: WordsByFirstLetter = {};
  private words: Word[] = [];
  private tokenizer: Tokenizer;
  private includePrefixPatterns: string[];
  private excludePrefixPatterns: string[];

  constructor(private app: App, private appHelper: AppHelper) {}

  async refreshWords(): Promise<void> {
    this.clearWords();

    const markdownFilePaths = this.app.vault
      .getMarkdownFiles()
      .map((x) => x.path)
      .filter((p) => this.includePrefixPatterns.every((x) => p.startsWith(x)))
      .filter((p) => this.excludePrefixPatterns.every((x) => !p.startsWith(x)));

    let wordByValue: { [value: string]: Word } = {};
    for (const path of markdownFilePaths) {
      const content = await this.app.vault.adapter.read(path);

      for (const token of this.tokenizer.tokenize(content)) {
        wordByValue[token] = {
          value: token,
          type: "currentVault",
          description: path,
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

  setSettings(
    tokenizer: Tokenizer,
    includePrefixPatterns: string[],
    excludePrefixPatterns: string[]
  ) {
    this.tokenizer = tokenizer;
    this.includePrefixPatterns = includePrefixPatterns;
    this.excludePrefixPatterns = excludePrefixPatterns;
  }
}
