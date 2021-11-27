import { App, MarkdownView } from "obsidian";
import { groupBy, uniq } from "../util/collection-helper";
import { Word, WordsByFirstLetter } from "./suggester";
import { Tokenizer } from "../tokenizer/tokenizer";
import { AppHelper } from "../app-helper";

export class CurrentFileWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter;

  constructor(
    private app: App,
    private appHelper: AppHelper,
    private tokenizer: Tokenizer
  ) {}

  async refreshWords(): Promise<void> {
    this.clearWords();

    if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
      return;
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      return;
    }

    const editor = this.appHelper.getMarkdownViewInActiveLeaf()!.editor;
    const currentLineContent = editor.getLine(editor.getCursor().line);

    const content = await this.app.vault.cachedRead(file);
    this.words = uniq(
      this.tokenizer.tokenize(content.replace(currentLineContent, ""))
    ).map((x) => ({
      value: x,
    }));
    this.wordsByFirstLetter = groupBy(this.words, (x) => x.value.charAt(0));
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetter = {};
  }
}
