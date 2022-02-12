export class ProviderStatusBar {
  constructor(
    public currentFile: HTMLElement,
    public currentVault: HTMLElement,
    public customDictionary: HTMLElement,
    public internalLink: HTMLElement,
    public tag: HTMLElement
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
    const tag = statusBar.createEl("span", {
      text: "---",
      cls: "various-complements__footer various-complements__footer__tag",
    });

    return new ProviderStatusBar(
      currentFile,
      currentVault,
      customDictionary,
      internalLink,
      tag
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
  setTagDisabled() {
    this.tag.setText("---");
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
  setTagIndexing() {
    this.tag.setText("indexing...");
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
  setTagIndexed(count: any) {
    this.tag.setText(String(count));
  }
}
