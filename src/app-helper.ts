import { App, parseFrontMatterAliases, TFile } from "obsidian";
import { uniq } from "./util/collection-helper";

export class AppHelper {
  constructor(private app: App) {}

  getAliases(file: TFile): string[] {
    return (
      parseFrontMatterAliases(
        this.app.metadataCache.getFileCache(file)?.frontmatter
      ) ?? []
    );
  }

  searchPhantomLinks(): string[] {
    return uniq(
      Object.values(this.app.metadataCache.unresolvedLinks)
        .map(Object.keys)
        .flat()
    );
  }
}
