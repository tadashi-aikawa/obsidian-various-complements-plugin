import { App } from "obsidian";
import { pushWord, Word, WordsByFirstLetter } from "./suggester";
import { AppHelper } from "../app-helper";
import { excludeEmoji } from "../util/strings";

export class InternalLinkWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter;

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(): void {
    this.clearWords();

    const resolvedInternalLinkWords = this.app.vault
      .getMarkdownFiles()
      .map((x) => {
        const lessEmojiValue = excludeEmoji(x.basename);
        const aliases =
          x.basename === lessEmojiValue
            ? this.appHelper.getAliases(x)
            : [lessEmojiValue, ...this.appHelper.getAliases(x)];
        return {
          value: x.basename,
          aliases,
          description: x.path,
          internalLink: true,
        };
      });

    const unresolvedInternalLinkWords = this.appHelper
      .searchPhantomLinks()
      .map((text) => {
        const lessEmojiValue = excludeEmoji(text);
        const aliases = text === lessEmojiValue ? undefined : [lessEmojiValue];
        return {
          value: text,
          aliases,
          description: "Not created yet",
          internalLink: true,
        };
      });

    this.words = [...resolvedInternalLinkWords, ...unresolvedInternalLinkWords];
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
}
