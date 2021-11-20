import { FileSystemAdapter, Notice } from "obsidian";

async function loadTokens(path: string): Promise<string[]> {
  const buf = await FileSystemAdapter.readLocalFile(path);
  const str = new TextDecoder().decode(buf);
  return str.split(/(\r\n|\n)/).filter((x) => x);
}

export class CustomDictionaryService {
  tokens: string[] = [];
  paths: string[];

  constructor(paths: string[]) {
    this.paths = paths;
  }

  async refreshCustomTokens(): Promise<void> {
    this.tokens = [];
    for (const path of this.paths) {
      try {
        (await loadTokens(path)).forEach((x) => this.tokens.push(x));
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
