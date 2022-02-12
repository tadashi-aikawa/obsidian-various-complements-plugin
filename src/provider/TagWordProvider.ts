import { App } from "obsidian";
import { pushWord, WordsByFirstLetter } from "./suggester";
import { AppHelper } from "../app-helper";
import { Word, WordType } from "../model/Word";
import { excludeEmoji } from "../util/strings";

export class TagWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter = {};

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(): void {
    this.clearWords();

    const synonymAliases = (name: string): string[] => {
      const lessEmojiValue = excludeEmoji(name);
      return name === lessEmojiValue ? [] : [lessEmojiValue];
    };

    this.words = this.app.vault.getMarkdownFiles().flatMap((f) =>
      this.appHelper.getTags(f).map((t) => ({
        value: t.slice(1), // Cut #
        type: "tag" as WordType,
        createdPath: f.path,
        description: f.path,
        aliases: synonymAliases(t.slice(1)), // Cut #
      }))
    );

    for (const word of this.words) {
      pushWord(this.wordsByFirstLetter, word.value.charAt(0), word);
      word.aliases?.forEach((a) =>
        pushWord(this.wordsByFirstLetter, a.charAt(0), word)
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
}
