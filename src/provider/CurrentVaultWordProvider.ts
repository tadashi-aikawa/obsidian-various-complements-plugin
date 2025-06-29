import type { App } from "obsidian";
import type { AppHelper } from "../app-helper";
import type { Word } from "../model/Word";
import type { Tokenizer } from "../tokenizer/tokenizer";
import { isMatchedGlobPatterns } from "../util/glob";
import { dirname } from "../util/path";
import { startsSmallLetterOnlyFirst, synonymAliases } from "../util/strings";
import { pushWord, type WordsByFirstLetter } from "./suggester";

export class CurrentVaultWordProvider {
  wordsByFirstLetter: WordsByFirstLetter = {};
  private words: Word[] = [];
  private tokenizer: Tokenizer;
  private includePrefixPatterns: string[];
  private excludePrefixPatterns: string[];
  private excludePathGlobPatterns: string[];
  private onlyUnderCurrentDirectory: boolean;

  constructor(
    private app: App,
    private appHelper: AppHelper,
  ) {}

  async refreshWords(option: {
    minNumberOfCharacters: number;
    makeSynonymAboutEmoji: boolean;
    makeSynonymAboutAccentsDiacritics: boolean;
    excludeWordPatterns: string[];
  }): Promise<void> {
    this.clearWords();

    const currentDirname = this.appHelper.getCurrentDirname();

    const markdownFilePaths = this.app.vault
      .getMarkdownFiles()
      .map((x) => x.path)
      .filter((p) => this.includePrefixPatterns.every((x) => p.startsWith(x)))
      .filter((p) => this.excludePrefixPatterns.every((x) => !p.startsWith(x)))
      .filter((p) => !isMatchedGlobPatterns(p, this.excludePathGlobPatterns))
      .filter(
        (p) => !this.onlyUnderCurrentDirectory || dirname(p) === currentDirname,
      );

    const excludePatterns = option.excludeWordPatterns.map(
      (x) => new RegExp(`^${x}$`),
    );
    let wordByValue: { [value: string]: Word } = {};
    for (const path of markdownFilePaths) {
      const content = await this.app.vault.adapter.read(path);

      const tokens = this.tokenizer
        .tokenize(content)
        .filter(
          (x) =>
            x.length >= option.minNumberOfCharacters &&
            !this.tokenizer.shouldIgnoreOnCurrent(x),
        )
        .map((x) => (startsSmallLetterOnlyFirst(x) ? x.toLowerCase() : x))
        .filter((x) => !excludePatterns.some((rp) => x.match(rp)));
      for (const token of tokens) {
        wordByValue[token] = {
          value: token,
          type: "currentVault",
          createdPath: path,
          description: path,
          aliases: synonymAliases(token, {
            emoji: option.makeSynonymAboutEmoji,
            accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
          }),
        };
      }
    }

    this.words = Object.values(wordByValue);
    for (const word of this.words) {
      pushWord(this.wordsByFirstLetter, word.value.charAt(0), word);
      word.aliases?.forEach((a) =>
        pushWord(this.wordsByFirstLetter, a.charAt(0), word),
      );
    }
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
    excludePathGlobPatterns: string[],
    onlyUnderCurrentDirectory: boolean,
  ) {
    this.tokenizer = tokenizer;
    this.includePrefixPatterns = includePrefixPatterns;
    this.excludePrefixPatterns = excludePrefixPatterns;
    this.excludePathGlobPatterns = excludePathGlobPatterns;
    this.onlyUnderCurrentDirectory = onlyUnderCurrentDirectory;
  }
}
