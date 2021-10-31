import { MarkdownView, Plugin } from "obsidian";
import { Editor } from "codemirror";
import "./show-hint";
import { createTokenizer, TokenizeStrategy } from "./tokenizer";

var CodeMirror: any = window.CodeMirror;

/**
 * This function uses case-sensitive logic if a second argument has an upper case. Otherwise, uses case-insensitive logic.
 */
const caseIncludes = (one: string, other: string): boolean => {
  const lowerOther = other.toLowerCase();
  return lowerOther === other
    ? one.toLowerCase().includes(lowerOther)
    : one.includes(other);
};

const lowerStartsWith = (a: string, b: string): boolean =>
  a.toLowerCase().startsWith(b.toLowerCase());

function selectSuggestedTokens(tokens: string[], word: string) {
  return Array.from(new Set(tokens))
    .filter((x) => x !== word)
    .filter((x) => caseIncludes(x, word))
    .sort((a, b) => a.length - b.length)
    .sort(
      (a, b) =>
        Number(lowerStartsWith(b, word)) - Number(lowerStartsWith(a, word))
    )
    .slice(0, 5);
}

export default class VariousComponentsPlugin extends Plugin {
  private execAutoComplete(strategy: TokenizeStrategy) {
    const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!currentView) {
      // Do nothing if the command is triggered outside a MarkdownView
      return;
    }

    const cmEditor = currentView.editor;

    CodeMirror.showHint(
      cmEditor,
      () => {
        const tokenized = createTokenizer(cmEditor, strategy).tokenize();
        if (!tokenized) {
          return;
        }

        const suggestedTokens = selectSuggestedTokens(
          tokenized.tokens,
          tokenized.currentToken
        );
        if (suggestedTokens.length === 0) {
          return;
        }

        const cursor = cmEditor.getCursor();
        return {
          list: suggestedTokens,
          from: CodeMirror.Pos(cursor.line, tokenized.currentTokenStart),
          to: CodeMirror.Pos(cursor.line, cursor.ch),
        };
      },
      {
        completeSingle: true,
      }
    );
  }

  async onload() {
    this.addCommand({
      id: "auto-complete",
      name: "Auto Complete",
      hotkeys: [{ modifiers: ["Ctrl"], key: " " }],
      checkCallback: (checking: boolean) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }

        this.execAutoComplete("default");
      },
    });
    this.addCommand({
      id: "auto-complete-as-arabic",
      name: "Auto Complete as Arabic",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }

        this.execAutoComplete("arabic");
      },
    });
    this.addCommand({
      id: "auto-complete-as-japanese",
      name: "Auto Complete as Japanese",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }

        this.execAutoComplete("japanese");
      },
    });
  }
}
