import { App, FileSystemAdapter, Notice } from "obsidian";
import { keyBy } from "../util/collection-helper";
import { pushWord, Word, WordsByFirstLetter } from "./suggester";

function lineToWord(line: string): Word {
  const [value, description, ...aliases] = line.split("\t");
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

  constructor(app: App, paths: string[]) {
    this.app = app;
    this.fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
    this.paths = paths;
  }

  updatePaths(paths: string[]): void {
    this.paths = paths;
  }

  async loadWords(path: string): Promise<Word[]> {
    return (await this.fileSystemAdapter.read(path))
      .split(/\r\n|\n/)
      .filter((x) => x)
      .map(lineToWord);
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
