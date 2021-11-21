import { App, FileSystemAdapter, Notice } from "obsidian";
import { keyBy } from "./util/collection-helper";

export interface Word {
  value: string;
  description?: string;
  aliases?: string[];
}

function lineToWord(line: string): Word {
  const [value, description, ...aliases] = line.split("\t");
  return {
    value,
    description,
    aliases,
  };
}

export class CustomDictionaryService {
  words: Word[] = [];

  private app: App;
  private fileSystemAdapter: FileSystemAdapter;
  private paths: string[];

  constructor(app: App, paths: string[]) {
    this.app = app;
    this.fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
    this.paths = paths;
  }

  get wordsByValue(): { [value: string]: Word } {
    return keyBy(this.words, (x) => x.value);
  }

  updatePaths(paths: string[]): void {
    this.paths = paths;
  }

  async loadWords(path: string): Promise<Word[]> {
    return (await this.fileSystemAdapter.read(path))
      .split(/(\r\n|\n)/)
      .filter((x) => x)
      .map(lineToWord);
  }

  async refreshCustomTokens(): Promise<void> {
    this.words = [];
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
  }
}
