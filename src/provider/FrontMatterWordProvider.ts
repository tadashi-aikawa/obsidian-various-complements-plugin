import { App, TFile } from "obsidian";
import { WordsByFirstLetter } from "./suggester";
import { AppHelper } from "../app-helper";
import { FrontMatterWord } from "../model/Word";
import { excludeEmoji } from "../util/strings";
import { groupBy } from "../util/collection-helper";

function synonymAliases(name: string): string[] {
  const lessEmojiValue = excludeEmoji(name);
  return name === lessEmojiValue ? [] : [lessEmojiValue];
}

function frontMatterToWords(
  file: TFile,
  key: string,
  value: string | string[]
): FrontMatterWord[] {
  const values = typeof value === "string" ? [value] : value;
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

    this.words = this.app.vault
      .getMarkdownFiles()
      .filter(
        (f) => this.appHelper.getFrontMatter(f) && activeFile?.path !== f.path
      )
      .flatMap((f) =>
        Object.entries(this.appHelper.getFrontMatter(f))
          .filter(
            ([key, value]) =>
              value != null &&
              (typeof value === "string" || typeof value[0] === "string")
          )
          .flatMap(([key, value]) => frontMatterToWords(f, key, value))
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
