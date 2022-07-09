import type { App } from "obsidian";
import { groupBy } from "../util/collection-helper";
import type { WordsByFirstLetter } from "./suggester";
import type { Tokenizer } from "../tokenizer/tokenizer";
import type { AppHelper } from "../app-helper";
import type { Word } from "../model/Word";
import { dirname } from "../util/path";
import { startsSmallLetterOnlyFirst } from "../util/strings";

export class CurrentVaultWordProvider {
  wordsByFirstLetter: WordsByFirstLetter = {};
  private words: Word[] = [];
  private tokenizer: Tokenizer;
  private includePrefixPatterns: string[];
  private excludePrefixPatterns: string[];
  private onlyUnderCurrentDirectory: boolean;

  constructor(private app: App, private appHelper: AppHelper) {}

  async refreshWords(minNumberOfCharacters: number): Promise<void> {
    this.clearWords();

    const currentDirname = this.appHelper.getCurrentDirname();

    const markdownFilePaths = this.app.vault
      .getMarkdownFiles()
      .map((x) => x.path)
      .filter((p) => this.includePrefixPatterns.every((x) => p.startsWith(x)))
      .filter((p) => this.excludePrefixPatterns.every((x) => !p.startsWith(x)))
      .filter(
        (p) => !this.onlyUnderCurrentDirectory || dirname(p) === currentDirname
      );

    let wordByValue: { [value: string]: Word } = {};
    for (const path of markdownFilePaths) {
      const content = await this.app.vault.adapter.read(path);

      const tokens = this.tokenizer
        .tokenize(content)
        .filter(
          (x) =>
            x.length >= minNumberOfCharacters &&
            !this.tokenizer.shouldIgnoreOnCurrent(x)
        )
        .map((x) => (startsSmallLetterOnlyFirst(x) ? x.toLowerCase() : x));
      for (const token of tokens) {
        wordByValue[token] = {
          value: token,
          type: "currentVault",
          createdPath: path,
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
    excludePrefixPatterns: string[],
    onlyUnderCurrentDirectory: boolean
  ) {
    this.tokenizer = tokenizer;
    this.includePrefixPatterns = includePrefixPatterns;
    this.excludePrefixPatterns = excludePrefixPatterns;
    this.onlyUnderCurrentDirectory = onlyUnderCurrentDirectory;
  }
}
