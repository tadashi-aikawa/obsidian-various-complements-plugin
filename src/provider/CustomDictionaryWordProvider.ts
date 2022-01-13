import { App, FileSystemAdapter, Notice, request } from "obsidian";
import { keyBy } from "../util/collection-helper";
import { pushWord, Word, WordsByFirstLetter } from "./suggester";
import { ColumnDelimiter } from "../option/ColumnDelimiter";

function lineToWord(line: string, delimiter: ColumnDelimiter): Word {
  const [value, description, ...aliases] = line.split(delimiter.value);
  return {
    value,
    description,
    aliases,
  };
}

export class CustomDictionaryWordProvider {
  private words: Word[] = [];
  wordByValue: { [value: string]: Word };
  wordsByFirstLetter: WordsByFirstLetter;

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

  update(paths: string[], delimiter: ColumnDelimiter): void {
    this.paths = paths;
    this.delimiter = delimiter;
  }

  async loadWords(path: string): Promise<Word[]> {
    const contents = path.match(new RegExp("^https?://"))
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

    this.wordByValue = keyBy(this.words, (x) => x.value);
    for (const word of this.words) {
      pushWord(this.wordsByFirstLetter, word.value.charAt(0), word);
      word.aliases?.forEach((a) =>
        pushWord(this.wordsByFirstLetter, a.charAt(0), word)
      );
    }
  }

  clearWords(): void {
    this.words = [];
    this.wordByValue = {};
    this.wordsByFirstLetter = {};
  }
}
