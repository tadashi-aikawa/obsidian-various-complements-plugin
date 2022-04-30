import { App, FileSystemAdapter, Notice, request } from "obsidian";
import { pushWord, type WordsByFirstLetter } from "./suggester";
import type { ColumnDelimiter } from "../option/ColumnDelimiter";
import { isURL } from "../util/path";
import type { Word } from "../model/Word";
import { excludeEmoji } from "../util/strings";
import type { AppHelper } from "../app-helper";

function escape(value: string): string {
  // This tricky logics for Safari
  // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/56
  return value
    .replace(/\\/g, "__VariousComplementsEscape__")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/__VariousComplementsEscape__/g, "\\\\");
}

function unescape(value: string): string {
  // This tricky logics for Safari
  // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/56
  return value
    .replace(/\\\\/g, "__VariousComplementsEscape__")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/__VariousComplementsEscape__/g, "\\");
}

function lineToWord(
  line: string,
  delimiter: ColumnDelimiter,
  path: string
): Word {
  const [value, description, ...aliases] = line.split(delimiter.value);
  return {
    value: unescape(value),
    description,
    aliases,
    type: "customDictionary",
    createdPath: path,
  };
}

function wordToLine(word: Word, delimiter: ColumnDelimiter): string {
  const escapedValue = escape(word.value);
  if (!word.description && !word.aliases) {
    return escapedValue;
  }
  if (!word.aliases) {
    return [escapedValue, word.description].join(delimiter.value);
  }
  return [escapedValue, word.description, ...word.aliases].join(
    delimiter.value
  );
}

function synonymAliases(name: string): string[] {
  const lessEmojiValue = excludeEmoji(name);
  return name === lessEmojiValue ? [] : [lessEmojiValue];
}

export class CustomDictionaryWordProvider {
  private words: Word[] = [];
  wordByValue: { [value: string]: Word } = {};
  wordsByFirstLetter: WordsByFirstLetter = {};

  private appHelper: AppHelper;
  private fileSystemAdapter: FileSystemAdapter;
  private paths: string[];
  private delimiter: ColumnDelimiter;

  constructor(app: App, appHelper: AppHelper) {
    this.appHelper = appHelper;
    this.fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
  }

  get editablePaths(): string[] {
    return this.paths.filter((x) => !isURL(x));
  }

  private async loadWords(path: string, regexp: string): Promise<Word[]> {
    const contents = isURL(path)
      ? await request({ url: path })
      : await this.fileSystemAdapter.read(path);

    return contents
      .split(/\r\n|\n/)
      .map((x) => x.replace(/%%.*%%/g, ""))
      .filter((x) => x)
      .map((x) => lineToWord(x, this.delimiter, path))
      .filter((x) => !regexp || x.value.match(new RegExp(regexp)));
  }

  async refreshCustomWords(regexp: string): Promise<void> {
    this.clearWords();

    for (const path of this.paths) {
      try {
        const words = await this.loadWords(path, regexp);
        words.forEach((x) => this.words.push(x));
      } catch (e) {
        // noinspection ObjectAllocationIgnored
        new Notice(
          `⚠ Fail to load ${path} -- Various Complements Plugin -- \n ${e}`,
          0
        );
      }
    }

    this.words.forEach((x) => this.addWord(x));
  }

  async addWordWithDictionary(
    word: Word,
    dictionaryPath: string
  ): Promise<void> {
    this.addWord(word);
    await this.fileSystemAdapter.append(
      dictionaryPath,
      "\n" + wordToLine(word, this.delimiter)
    );
  }

  private addWord(word: Word) {
    // Add aliases as a synonym
    const wordWithSynonym = {
      ...word,
      aliases: [...(word.aliases ?? []), ...synonymAliases(word.value)],
    };

    this.wordByValue[wordWithSynonym.value] = wordWithSynonym;
    pushWord(
      this.wordsByFirstLetter,
      wordWithSynonym.value.charAt(0),
      wordWithSynonym
    );
    wordWithSynonym.aliases?.forEach((a) =>
      pushWord(this.wordsByFirstLetter, a.charAt(0), wordWithSynonym)
    );
  }

  clearWords(): void {
    this.words = [];
    this.wordByValue = {};
    this.wordsByFirstLetter = {};
  }

  get wordCount(): number {
    return this.words.length;
  }

  setSettings(paths: string[], delimiter: ColumnDelimiter) {
    this.paths = paths;
    this.delimiter = delimiter;
  }
}
