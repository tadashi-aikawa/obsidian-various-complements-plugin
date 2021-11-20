import { App, FileSystemAdapter, Notice } from "obsidian";

async function loadTokens(path: string): Promise<string[]> {
  const buf = await FileSystemAdapter.readLocalFile(path);
  const str = new TextDecoder().decode(buf);
  return str.split(/(\r\n|\n)/).filter((x) => x);
}

export class CustomDictionaryService {
  tokens: string[] = [];

  private app: App;
  private paths: string[];

  constructor(app: App, paths: string[]) {
    this.app = app;
    this.paths = paths;
  }

  updatePaths(paths: string[]): void {
    this.paths = paths;
  }

  async refreshCustomTokens(): Promise<void> {
    const fileSystemAdapter = this.app.vault.adapter as FileSystemAdapter;

    this.tokens = [];
    for (const path of this.paths) {
      try {
        const isRelative = path.startsWith("./") || path.startsWith(".\\");
        const absolutePath = isRelative
          ? fileSystemAdapter.getFullPath(path)
          : path;

        const tokens = await loadTokens(absolutePath);
        tokens.forEach((x) => this.tokens.push(x));
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
