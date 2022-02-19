import { MatchStrategy } from "../provider/MatchStrategy";

export class ProviderStatusBar {
  constructor(
    public currentFile: HTMLElement | null,
    public currentVault: HTMLElement | null,
    public customDictionary: HTMLElement | null,
    public internalLink: HTMLElement | null,
    public frontMatter: HTMLElement | null,
    public matchStrategy: HTMLElement | null
  ) {}

  static new(
    statusBar: HTMLElement,
    showMatchStrategy: boolean,
    showIndexingStatus: boolean
  ): ProviderStatusBar {
    const currentFile = showIndexingStatus
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__current-file",
        })
      : null;
    const currentVault = showIndexingStatus
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__current-vault",
        })
      : null;
    const customDictionary = showIndexingStatus
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__custom-dictionary",
        })
      : null;
    const internalLink = showIndexingStatus
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__internal-link",
        })
      : null;
    const frontMatter = showIndexingStatus
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__front-matter",
        })
      : null;

    const matchStrategy = showMatchStrategy
      ? statusBar.createEl("span", {
          text: "---",
          cls: "various-complements__footer various-complements__footer__match-strategy",
        })
      : null;

    return new ProviderStatusBar(
      currentFile,
      currentVault,
      customDictionary,
      internalLink,
      frontMatter,
      matchStrategy
    );
  }

  setOnClickStrategyListener(listener: () => void) {
    this.matchStrategy?.addEventListener("click", listener);
  }

  setCurrentFileDisabled() {
    this.currentFile?.setText("---");
  }
  setCurrentVaultDisabled() {
    this.currentVault?.setText("---");
  }
  setCustomDictionaryDisabled() {
    this.customDictionary?.setText("---");
  }
  setInternalLinkDisabled() {
    this.internalLink?.setText("---");
  }
  setFrontMatterDisabled() {
    this.frontMatter?.setText("---");
  }

  setCurrentFileIndexing() {
    this.currentFile?.setText("indexing...");
  }
  setCurrentVaultIndexing() {
    this.currentVault?.setText("indexing...");
  }
  setCustomDictionaryIndexing() {
    this.customDictionary?.setText("indexing...");
  }
  setInternalLinkIndexing() {
    this.internalLink?.setText("indexing...");
  }
  setFrontMatterIndexing() {
    this.frontMatter?.setText("indexing...");
  }

  setCurrentFileIndexed(count: any) {
    this.currentFile?.setText(String(count));
  }
  setCurrentVaultIndexed(count: any) {
    this.currentVault?.setText(String(count));
  }
  setCustomDictionaryIndexed(count: any) {
    this.customDictionary?.setText(String(count));
  }
  setInternalLinkIndexed(count: any) {
    this.internalLink?.setText(String(count));
  }
  setFrontMatterIndexed(count: any) {
    this.frontMatter?.setText(String(count));
  }

  setMatchStrategy(strategy: MatchStrategy) {
    this.matchStrategy?.setText(strategy.name);
  }
}
