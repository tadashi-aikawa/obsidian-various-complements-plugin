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

async function loadWords(path: string): Promise<Word[]> {
  const buf = await FileSystemAdapter.readLocalFile(path);
  const str = new TextDecoder().decode(buf);
  return str
    .split(/(\r\n|\n)/)
    .filter((x) => x)
    .map(lineToWord);
}

export class CustomDictionaryService {
  words: Word[] = [];

  private app: App;
  private paths: string[];

  constructor(app: App, paths: string[]) {
    this.app = app;
    this.paths = paths;
  }

  get wordsByValue(): { [value: string]: Word } {
    return keyBy(this.words, (x) => x.value);
  }

  updatePaths(paths: string[]): void {
    this.paths = paths;
  }

  async refreshCustomTokens(): Promise<void> {
    const fileSystemAdapter = this.app.vault.adapter as FileSystemAdapter;

    this.words = [];
    for (const path of this.paths) {
      try {
        const isRelative = path.startsWith("./") || path.startsWith(".\\");
        const absolutePath = isRelative
          ? fileSystemAdapter.getFullPath(path)
          : path;

        const words = await loadWords(absolutePath);
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
