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
