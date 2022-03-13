import { App } from "obsidian";
import { pushWord, WordsByFirstLetter } from "./suggester";
import { AppHelper } from "../app-helper";
import { excludeEmoji } from "../util/strings";
import { InternalLinkWord, Word, WordType } from "../model/Word";

export class InternalLinkWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter = {};

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(
    wordAsInternalLinkAlias: boolean,
    excludePathPrefixPatterns: string[]
  ): void {
    this.clearWords();

    const synonymAliases = (name: string): string[] => {
      const lessEmojiValue = excludeEmoji(name);
      return name === lessEmojiValue ? [] : [lessEmojiValue];
    };

    const resolvedInternalLinkWords: InternalLinkWord[] = this.app.vault
      .getMarkdownFiles()
      .filter((f) =>
        excludePathPrefixPatterns.every((x) => !f.path.startsWith(x))
      )
      .flatMap((x) => {
        const aliases = this.appHelper.getAliases(x);

        if (wordAsInternalLinkAlias) {
          return [
            {
              value: x.basename,
              type: "internalLink",
              createdPath: x.path,
              aliases: synonymAliases(x.basename),
              description: x.path,
            },
            ...aliases.map((a) => ({
              value: a,
              type: "internalLink",
              createdPath: x.path,
              aliases: synonymAliases(a),
              description: x.path,
              aliasMeta: {
                origin: x.basename,
              },
            })),
          ] as InternalLinkWord[];
        } else {
          return [
            {
              value: x.basename,
              type: "internalLink",
              createdPath: x.path,
              aliases: [
                ...synonymAliases(x.basename),
                ...aliases,
                ...aliases.flatMap(synonymAliases),
              ],
              description: x.path,
            },
          ] as InternalLinkWord[];
        }
      });

    const unresolvedInternalLinkWords: InternalLinkWord[] = this.appHelper
      .searchPhantomLinks()
      .map(({ path, link }) => {
        return {
          value: link,
          type: "internalLink",
          createdPath: path,
          aliases: synonymAliases(link),
          description: `Appeared in -> ${path}`,
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

  get wordCount(): number {
    return this.words.length;
  }
}
