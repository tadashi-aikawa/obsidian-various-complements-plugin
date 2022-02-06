import { App, FileSystemAdapter, Notice, request } from "obsidian";
import { pushWord, Word, WordsByFirstLetter } from "./suggester";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { isURL } from "../util/path";

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

function lineToWord(line: string, delimiter: ColumnDelimiter): Word {
  const [value, description, ...aliases] = line.split(delimiter.value);
  return {
    value: unescape(value),
    description,
    aliases,
    type: "customDictionary",
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

export class CustomDictionaryWordProvider {
  private words: Word[] = [];
  wordByValue: { [value: string]: Word } = {};
  wordsByFirstLetter: WordsByFirstLetter = {};

  private app: App;
  private fileSystemAdapter: FileSystemAdapter;
  private paths: string[];
  private delimiter: ColumnDelimiter;

  constructor(app: App, paths: string[], delimiter: ColumnDelimiter) {
    this.app = app;
    this.fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
    this.paths = paths;
    this.delimiter = delimiter;
  }

  get editablePaths(): string[] {
    return this.paths.filter((x) => !isURL(x));
  }

  update(paths: string[], delimiter: ColumnDelimiter): void {
    this.paths = paths;
    this.delimiter = delimiter;
  }

  private async loadWords(path: string): Promise<Word[]> {
    const contents = isURL(path)
      ? await request({ url: path })
      : await this.fileSystemAdapter.read(path);

    return contents
      .split(/\r\n|\n/)
      .map((x) => x.replace(/%%.*%%/g, ""))
      .filter((x) => x)
      .map((x) => lineToWord(x, this.delimiter));
  }

  async refreshCustomWords(): Promise<void> {
    this.clearWords();

    for (const path of this.paths) {
      try {
        const words = await this.loadWords(path);
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
    this.wordByValue[word.value] = word;
    pushWord(this.wordsByFirstLetter, word.value.charAt(0), word);
    word.aliases?.forEach((a) =>
      pushWord(this.wordsByFirstLetter, a.charAt(0), word)
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
}
