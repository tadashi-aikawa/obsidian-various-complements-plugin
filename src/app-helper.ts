import {
  App,
  Editor,
  MarkdownView,
  parseFrontMatterAliases,
  parseFrontMatterTags,
  TFile,
} from "obsidian";

export class AppHelper {
  constructor(private app: App) {}

  getAliases(file: TFile): string[] {
    return (
      parseFrontMatterAliases(
        this.app.metadataCache.getFileCache(file)?.frontmatter
      ) ?? []
    );
  }

  getFrontMatterTags(file: TFile): string[] {
    return (
      parseFrontMatterTags(
        this.app.metadataCache.getFileCache(file)?.frontmatter
      ) ?? []
    );
  }

  getTags(file: TFile): string[] {
    return this.getFrontMatterTags(file).concat(
      this.app.metadataCache.getFileCache(file)?.tags?.map((x) => x.tag) ?? []
    );
  }

  getMarkdownViewInActiveLeaf(): MarkdownView | null {
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return null;
    }

    return this.app.workspace.activeLeaf!.view as MarkdownView;
  }

  getCurrentDirname(): string | null {
    return this.app.workspace.getActiveFile()?.parent.path ?? null;
  }

  getCurrentEditor(): Editor | null {
    return this.getMarkdownViewInActiveLeaf()?.editor ?? null;
  }

  getSelection(): string | undefined {
    return this.getCurrentEditor()?.getSelection();
  }

  getCurrentOffset(editor: Editor): number {
    return editor.posToOffset(editor.getCursor());
  }

  getCurrentLine(editor: Editor): string {
    return editor.getLine(editor.getCursor().line);
  }

  getCurrentLineUntilCursor(editor: Editor): string {
    return this.getCurrentLine(editor).slice(0, editor.getCursor().ch);
  }

  searchPhantomLinks(): { path: string; link: string }[] {
    return Object.entries(this.app.metadataCache.unresolvedLinks).flatMap(
      ([path, obj]) => Object.keys(obj).map((link) => ({ path, link }))
    );
  }

  getMarkdownFileByPath(path: string): TFile | null {
    if (!path.endsWith(".md")) {
      return null;
    }

    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (!abstractFile) {
      return null;
    }

    return abstractFile as TFile;
  }

  openMarkdownFile(file: TFile, newLeaf: boolean, offset: number = 0) {
    const leaf = this.app.workspace.getLeaf(newLeaf);

    leaf
      .openFile(file, this.app.workspace.activeLeaf?.getViewState())
      .then(() => {
        this.app.workspace.setActiveLeaf(leaf, true, true);
        const viewOfType = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (viewOfType) {
          const editor = viewOfType.editor;
          const pos = editor.offsetToPos(offset);
          editor.setCursor(pos);
          editor.scrollIntoView({ from: pos, to: pos }, true);
        }
      });
  }

  inFrontMatter(): boolean {
    const editor = this.getCurrentEditor();
    if (!editor) {
      return false;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      return false;
    }

    if (editor.getLine(0) !== "---") {
      return false;
    }
    const endPosition = editor.getValue().indexOf("---", 3);

    return endPosition === -1 || this.getCurrentOffset(editor) < endPosition;
  }

  /**
   * Unsafe method
   */
  isIMEOn(): boolean {
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return false;
    }

    const markdownView = this.app.workspace.activeLeaf!.view as MarkdownView;
    const cm5or6: any = (markdownView.editor as any).cm;

    // cm6
    if (cm5or6?.inputState?.composing > 0) {
      return true;
    }

    // cm5
    return !!cm5or6?.display?.input?.composing;
  }
}
