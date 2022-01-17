import {
  App,
  Editor,
  MarkdownView,
  parseFrontMatterAliases,
  TFile,
} from "obsidian";
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

  getMarkdownViewInActiveLeaf(): MarkdownView | null {
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return null;
    }

    return this.app.workspace.activeLeaf!.view as MarkdownView;
  }

  getCurrentEditor(): Editor | null {
    return this.getMarkdownViewInActiveLeaf()?.editor ?? null;
  }

  getSelection(): string | undefined {
    return this.getCurrentEditor()?.getSelection();
  }

  getCurrentLine(editor: Editor): string {
    return editor.getLine(editor.getCursor().line);
  }

  getCurrentLineUntilCursor(editor: Editor): string {
    return this.getCurrentLine(editor).slice(0, editor.getCursor().ch);
  }

  searchPhantomLinks(): string[] {
    return uniq(
      Object.values(this.app.metadataCache.unresolvedLinks)
        .map(Object.keys)
        .flat()
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
