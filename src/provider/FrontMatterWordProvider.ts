import { App, TFile } from "obsidian";
import { WordsByFirstLetter } from "./suggester";
import { AppHelper, FrontMatterValue } from "../app-helper";
import { FrontMatterWord } from "../model/Word";
import { excludeEmoji } from "../util/strings";
import { groupBy, uniqWith } from "../util/collection-helper";

function synonymAliases(name: string): string[] {
  const lessEmojiValue = excludeEmoji(name);
  return name === lessEmojiValue ? [] : [lessEmojiValue];
}

function frontMatterToWords(
  file: TFile,
  key: string,
  values: FrontMatterValue
): FrontMatterWord[] {
  return values.map((x) => ({
    key,
    value: x,
    type: "frontMatter",
    createdPath: file.path,
    aliases: synonymAliases(x),
  }));
}

export class FrontMatterWordProvider {
  words: FrontMatterWord[];
  wordsByFirstLetterByKey: { [key: string]: WordsByFirstLetter };

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(): void {
    this.clearWords();

    const activeFile = this.appHelper.getActiveFile();

    const words = this.app.vault.getMarkdownFiles().flatMap((f) => {
      const fm = this.appHelper.getFrontMatter(f);
      if (!fm || activeFile?.path === f.path) {
        return [];
      }

      return Object.entries(fm)
        .filter(
          ([_key, value]) =>
            value != null &&
            (typeof value === "string" || typeof value[0] === "string")
        )
        .flatMap(([key, value]) => frontMatterToWords(f, key, value));
    });

    this.words = uniqWith(
      words,
      (a, b) => a.key === b.key && a.value === b.value
    );

    const wordsByKey = groupBy(this.words, (x) => x.key);
    this.wordsByFirstLetterByKey = Object.fromEntries(
      Object.entries(wordsByKey).map(
        ([key, words]: [string, FrontMatterWord[]]) => [
          key,
          groupBy(words, (w) => w.value.charAt(0)),
        ]
      )
    );
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetterByKey = {};
  }

  get wordCount(): number {
    return this.words.length;
  }
}
