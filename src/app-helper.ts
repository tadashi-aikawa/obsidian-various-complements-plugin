import {
  App,
  Editor,
  MarkdownView,
  parseFrontMatterAliases,
  parseFrontMatterStringArray,
  parseFrontMatterTags,
  TFile,
} from "obsidian";

export type FrontMatterValue = string[];

export class AppHelper {
  constructor(private app: App) {}

  getAliases(file: TFile): string[] {
    return (
      parseFrontMatterAliases(
        this.app.metadataCache.getFileCache(file)?.frontmatter
      ) ?? []
    );
  }

  getFrontMatter(file: TFile): { [key: string]: FrontMatterValue } | undefined {
    const frontMatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontMatter) {
      return undefined;
    }

    // remove #
    const tags =
      parseFrontMatterTags(frontMatter)?.map((x) => x.slice(1)) ?? [];
    const aliases = parseFrontMatterAliases(frontMatter) ?? [];
    const { position, ...rest } = frontMatter;
    return {
      ...Object.fromEntries(
        Object.entries(rest).map(([k, _v]) => [
          k,
          parseFrontMatterStringArray(frontMatter, k),
        ])
      ),
      tags,
      tag: tags,
      aliases,
      alias: aliases,
    };
  }

  getMarkdownViewInActiveLeaf(): MarkdownView | null {
    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return null;
    }

    return this.app.workspace.activeLeaf!.view as MarkdownView;
  }

  getActiveFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }

  getCurrentDirname(): string | null {
    return this.getActiveFile()?.parent.path ?? null;
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

  getCurrentFrontMatter(): string | null {
    const editor = this.getCurrentEditor();
    if (!editor) {
      return null;
    }

    if (!this.getActiveFile()) {
      return null;
    }

    if (editor.getLine(0) !== "---") {
      return null;
    }
    const endPosition = editor.getValue().indexOf("---", 3);

    const currentOffset = this.getCurrentOffset(editor);
    if (endPosition !== -1 && currentOffset >= endPosition) {
      return null;
    }

    const keyLocations = Array.from(editor.getValue().matchAll(/.+:/g));
    if (keyLocations.length === 0) {
      return null;
    }

    const currentKeyLocation = keyLocations
      .filter((x) => x.index! < currentOffset)
      .last();
    if (!currentKeyLocation) {
      return null;
    }

    return currentKeyLocation[0].split(":")[0];
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
