export class ProviderStatusBar {
  constructor(
    public currentFile: HTMLElement,
    public currentVault: HTMLElement,
    public customDictionary: HTMLElement,
    public internalLink: HTMLElement,
    public frontMatter: HTMLElement
  ) {}

  static new(statusBar: HTMLElement): ProviderStatusBar {
    const currentFile = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__current-file",
    });
    const currentVault = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__current-vault",
    });
    const customDictionary = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__custom-dictionary",
    });
    const internalLink = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__internal-link",
    });
    const frontMatter = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__front-matter",
    });

    return new ProviderStatusBar(
      currentFile,
      currentVault,
      customDictionary,
      internalLink,
      frontMatter
    );
  }

  setCurrentFileDisabled() {
    this.currentFile.setText("---");
  }
  setCurrentVaultDisabled() {
    this.currentVault.setText("---");
  }
  setCustomDictionaryDisabled() {
    this.customDictionary.setText("---");
  }
  setInternalLinkDisabled() {
    this.internalLink.setText("---");
  }
  setFrontMatterDisabled() {
    this.frontMatter.setText("---");
  }

  setCurrentFileIndexing() {
    this.currentFile.setText("indexing...");
  }
  setCurrentVaultIndexing() {
    this.currentVault.setText("indexing...");
  }
  setCustomDictionaryIndexing() {
    this.customDictionary.setText("indexing...");
  }
  setInternalLinkIndexing() {
    this.internalLink.setText("indexing...");
  }
  setFrontMatterIndexing() {
    this.frontMatter.setText("indexing...");
  }

  setCurrentFileIndexed(count: any) {
    this.currentFile.setText(String(count));
  }
  setCurrentVaultIndexed(count: any) {
    this.currentVault.setText(String(count));
  }
  setCustomDictionaryIndexed(count: any) {
    this.customDictionary.setText(String(count));
  }
  setInternalLinkIndexed(count: any) {
    this.internalLink.setText(String(count));
  }
  setFrontMatterIndexed(count: any) {
    this.frontMatter.setText(String(count));
  }
}
