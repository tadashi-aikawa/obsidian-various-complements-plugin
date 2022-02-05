import { App } from "obsidian";
import { pushWord, Word, WordsByFirstLetter, WordType } from "./suggester";
import { AppHelper } from "../app-helper";
import { excludeEmoji } from "../util/strings";

export class InternalLinkWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter;

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(wordAsInternalLinkAlias: boolean): void {
    this.clearWords();

    const synonymAliases = (name: string): string[] => {
      const lessEmojiValue = excludeEmoji(name);
      return name === lessEmojiValue ? [] : [lessEmojiValue];
    };

    const resolvedInternalLinkWords = this.app.vault
      .getMarkdownFiles()
      .flatMap((x) => {
        const aliases = this.appHelper.getAliases(x);

        if (wordAsInternalLinkAlias) {
          return [
            {
              value: x.basename,
              type: "internalLink" as WordType,
              aliases: synonymAliases(x.basename),
              description: x.path,
            },
            ...aliases.map((a) => ({
              value: a,
              type: "internalLink" as WordType,
              aliases: synonymAliases(a),
              description: x.path,
              aliasMeta: {
                origin: x.basename,
              },
            })),
          ];
        } else {
          return [
            {
              value: x.basename,
              type: "internalLink" as WordType,
              aliases: [
                ...synonymAliases(x.basename),
                ...aliases,
                ...aliases.flatMap(synonymAliases),
              ],
              description: x.path,
            },
          ];
        }
      });

    const unresolvedInternalLinkWords = this.appHelper
      .searchPhantomLinks()
      .map((text) => {
        return {
          value: text,
          type: "internalLink" as WordType,
          aliases: synonymAliases(text),
          description: "Not created yet",
          phantom: true,
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
