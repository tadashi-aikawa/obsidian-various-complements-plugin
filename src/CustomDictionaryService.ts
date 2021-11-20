import { FileSystemAdapter, Notice } from "obsidian";

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
        const buf = await FileSystemAdapter.readLocalFile(path);
        const str = new TextDecoder().decode(buf);
        for (const line of str.split(/(\r\n|\n)/)) {
          if (line !== "") {
            this.tokens.push(line);
          }
        }
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
