import type { App, TFile } from "obsidian";
import type { AppHelper, FrontMatterValue } from "../app-helper";
import type { FrontMatterWord } from "../model/Word";
import { groupBy, uniqBy } from "../util/collection-helper";
import { excludeEmoji } from "../util/strings";
import type { WordsByFirstLetter } from "./suggester";

function synonymAliases(name: string): string[] {
  const lessEmojiValue = excludeEmoji(name);
  return name === lessEmojiValue ? [] : [lessEmojiValue];
}

function frontMatterToWords(
  file: TFile,
  key: string,
  values: FrontMatterValue,
): FrontMatterWord[] {
  return values.map((x) => ({
    key,
    value: x,
    type: "frontMatter",
    createdPath: file.path,
    aliases: synonymAliases(x),
  }));
}

function pickWords(file: TFile, fm: { [key: string]: FrontMatterValue }) {
  return Object.entries(fm)
    .filter(
      ([_key, value]) =>
        value != null &&
        (typeof value === "string" || typeof value[0] === "string"),
    )
    .flatMap(([key, value]) => frontMatterToWords(file, key, value));
}

// noinspection FunctionWithMultipleLoopsJS
function extractAndUniqWords(
  wordsByCreatedPath: FrontMatterWordProvider["wordsByCreatedPath"],
): FrontMatterWord[] {
  return uniqBy(
    Object.values(wordsByCreatedPath).flat(),
    (w) => w.key + w.value.toLowerCase(),
  );
}

function indexingWords(
  words: FrontMatterWord[],
): FrontMatterWordProvider["wordsByFirstLetterByKey"] {
  const wordsByKey = groupBy(words, (x) => x.key);
  return Object.fromEntries(
    Object.entries(wordsByKey).map(
      ([key, words]: [string, FrontMatterWord[]]) => [
        key,
        groupBy(words, (w) => w.value.charAt(0)),
      ],
    ),
  );
}

export class FrontMatterWordProvider {
  private wordsByCreatedPath: { [path: string]: FrontMatterWord[] } = {};
  words: FrontMatterWord[];
  wordsByFirstLetterByKey: { [key: string]: WordsByFirstLetter };

  constructor(
    private app: App,
    private appHelper: AppHelper,
  ) {}

  refreshWords(): void {
    this.clearWords();

    this.app.vault.getMarkdownFiles().forEach((f) => {
      const fm = this.appHelper.getFrontMatter(f);
      if (!fm) {
        return;
      }

      this.wordsByCreatedPath[f.path] = pickWords(f, fm);
    });

    this.words = extractAndUniqWords(this.wordsByCreatedPath);
    this.wordsByFirstLetterByKey = indexingWords(this.words);
  }

  updateWordIndex(file: TFile): void {
    const fm = this.appHelper.getFrontMatter(file);
    if (!fm) {
      return;
    }

    this.wordsByCreatedPath[file.path] = pickWords(file, fm);
  }

  updateWords(): void {
    this.words = extractAndUniqWords(this.wordsByCreatedPath);
    this.wordsByFirstLetterByKey = indexingWords(this.words);
  }

  clearWords(): void {
    this.wordsByCreatedPath = {};
    this.words = [];
    this.wordsByFirstLetterByKey = {};
  }

  get wordCount(): number {
    return this.words.length;
  }
}
