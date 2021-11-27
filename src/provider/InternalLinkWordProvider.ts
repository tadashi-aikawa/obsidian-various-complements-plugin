import { App } from "obsidian";
import { pushWord, Word, WordsByFirstLetter } from "./suggester";
import { AppHelper } from "../app-helper";

export class InternalLinkWordProvider {
  private words: Word[] = [];
  wordsByFirstLetter: WordsByFirstLetter;

  constructor(private app: App, private appHelper: AppHelper) {}

  refreshWords(): void {
    this.clearWords();

    const resolvedInternalLinkWords = this.app.vault
      .getMarkdownFiles()
      .map((x) => ({
        value: `[[${x.basename}]]`,
        aliases: [x.basename, ...this.appHelper.getAliases(x)],
        description: x.path,
      }));

    const unresolvedInternalLinkWords = this.appHelper
      .searchPhantomLinks()
      .map((x) => ({
        value: `[[${x}]]`,
        aliases: [x],
        description: "Not created yet",
      }));

    this.words = [...resolvedInternalLinkWords, ...unresolvedInternalLinkWords];
    for (const word of this.words) {
      // 2 because `[[..`
      pushWord(this.wordsByFirstLetter, word.value.charAt(2), word);
      word.aliases?.forEach((a) =>
        pushWord(this.wordsByFirstLetter, a.charAt(2), word)
      );
    }
  }

  clearWords(): void {
    this.words = [];
    this.wordsByFirstLetter = {};
  }
}
