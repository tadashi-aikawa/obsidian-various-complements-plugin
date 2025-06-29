import type { App } from "obsidian";
import { hasSameElement } from "../../src/util/collection-helper";
import type { AppHelper } from "../app-helper";
import type { InternalLinkWord, Word } from "../model/Word";
import { isMatchedGlobPatterns } from "../util/glob";
import { synonymAliases } from "../util/strings";
import { pushWord, type WordsByFirstLetter } from "./suggester";

export class InternalLinkWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter = {};

  constructor(
    private app: App,
    private appHelper: AppHelper,
  ) {}

  refreshWords(option: {
    wordAsInternalLinkAlias: boolean;
    excludePathPrefixPatterns: string[];
    excludePathGlobPatterns: string[];
    makeSynonymAboutEmoji: boolean;
    makeSynonymAboutAccentsDiacritics: boolean;
    frontMatterKeyForExclusion: string;
    tagsForExclusion: string[];
  }): void {
    this.clearWords();

    const resolvedInternalLinkWords: InternalLinkWord[] = this.app.vault
      .getMarkdownFiles()
      .filter((f) => {
        if (
          option.excludePathPrefixPatterns.some((x) => f.path.startsWith(x))
        ) {
          return false;
        }

        if (isMatchedGlobPatterns(f.path, option.excludePathGlobPatterns)) {
          return false;
        }

        const fmkfc = option.frontMatterKeyForExclusion;
        if (fmkfc && this.appHelper.getBoolFrontMatter(f, fmkfc)) {
          return false;
        }

        if (option.tagsForExclusion.length > 0) {
          const tags = this.appHelper.getTagsProperty(f);
          if (hasSameElement(option.tagsForExclusion, tags)) {
            return false;
          }
        }

        return true;
      })
      .flatMap((x) => {
        const aliases = this.appHelper.getAliases(x);

        if (option.wordAsInternalLinkAlias) {
          return [
            {
              value: x.basename,
              type: "internalLink",
              createdPath: x.path,
              aliases: synonymAliases(x.basename, {
                emoji: option.makeSynonymAboutEmoji,
                accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
              }),
              description: x.path,
            },
            ...aliases.map((a) => ({
              value: a,
              type: "internalLink",
              createdPath: x.path,
              aliases: synonymAliases(a, {
                emoji: option.makeSynonymAboutEmoji,
                accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
              }),
              description: x.path,
              aliasMeta: {
                origin: x.path,
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
                ...synonymAliases(x.basename, {
                  emoji: option.makeSynonymAboutEmoji,
                  accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
                }),
                ...aliases,
                ...aliases.flatMap((al) =>
                  synonymAliases(al, {
                    emoji: option.makeSynonymAboutEmoji,
                    accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
                  }),
                ),
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
          aliases: synonymAliases(link, {
            emoji: option.makeSynonymAboutEmoji,
            accentsDiacritics: option.makeSynonymAboutAccentsDiacritics,
          }),
          description: `Appeared in -> ${path}`,
          phantom: true,
        };
      });

    this.words = [...resolvedInternalLinkWords, ...unresolvedInternalLinkWords];
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
}
