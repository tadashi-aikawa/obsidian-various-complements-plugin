import type { App } from "obsidian";
import type { AppHelper } from "../app-helper";
import type { Word } from "../model/Word";
import type { Tokenizer } from "../tokenizer/tokenizer";
import { uniq } from "../util/collection-helper";
import {
  allAlphabets,
  startsSmallLetterOnlyFirst,
  synonymAliases,
} from "../util/strings";
import { pushWord, type WordsByFirstLetter } from "./suggester";

export class CurrentFileWordProvider {
  wordsByFirstLetter: WordsByFirstLetter = {};
  private words: Word[] = [];
  private tokenizer: Tokenizer;

  constructor(
    private app: App,
    private appHelper: AppHelper,
  ) {}

  async refreshWords(option: {
    onlyEnglish: boolean;
    minNumberOfCharacters: number;
    makeSynonymAboutEmoji: boolean;
    makeSynonymAboutAccentsDiacritics: boolean;
    excludeWordPatterns: string[];
  }): Promise<void> {
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
        editor.getLine(editor.getCursor().line).slice(0, editor.getCursor().ch),
      )
      .last();

    const excludePatterns = option.excludeWordPatterns.map(
      (x) => new RegExp(`^${x}$`),
    );
    const content = await this.app.vault.cachedRead(file);
    const tokens = this.tokenizer
      .tokenize(content)
      .filter((x) => {
        if (x.length < option.minNumberOfCharacters) {
          return false;
        }
        if (this.tokenizer.shouldIgnoreOnCurrent(x)) {
          return false;
        }
        return option.onlyEnglish ? allAlphabets(x) : true;
      })
      .map((x) => (startsSmallLetterOnlyFirst(x) ? x.toLowerCase() : x))
      .filter((x) => !excludePatterns.some((rp) => x.match(rp)));
    this.words = uniq(tokens)
      .filter((x) => x !== currentToken)
      .map((x) => ({
        value: x,
        type: "currentFile",
        createdPath: file.path,
        aliases: synonymAliases(x, {
          emoji: option.makeSynonymAboutEmoji,
          accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
        }),
      }));

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

  setSettings(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }
}
