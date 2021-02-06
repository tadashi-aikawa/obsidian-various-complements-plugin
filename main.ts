import { Plugin } from "obsidian";
import { Editor } from "codemirror";
var CodeMirror: any = window.CodeMirror;
import "./show-hint";
import TinySegmenter from "./tiny-segmenter";
// @ts-ignore
const segmenter = new TinySegmenter();

function pickTokens(cmEditor: Editor): string[] {
  return cmEditor
    .getValue()
    .split(`\n`)
    .flatMap<string>((x) => segmenter.segment(x))
    .map((x) => x.replace(/[\[\]()<>]/, ""));
}

const lowerIncludes = (a: string, b: string): boolean =>
  a.toLowerCase().includes(b.toLowerCase());

const lowerStartsWith = (a: string, b: string): boolean =>
  a.toLowerCase().startsWith(b.toLowerCase());

function selectSuggestedTokens(tokens: string[], word: string) {
  return Array.from(new Set(tokens))
    .filter((x) => x !== word)
    .filter((x) => lowerIncludes(x, word))
    .sort((a, b) => a.length - b.length)
    .sort(
      (a, b) =>
        Number(lowerStartsWith(b, word)) - Number(lowerStartsWith(a, word))
    )
    .slice(0, 5);
}

export default class MyPlugin extends Plugin {
  private execAutoComplete() {
    const currentView = this.app.workspace.activeLeaf.view;
    const cmEditor: Editor = (currentView as any).sourceMode.cmEditor;

    CodeMirror.showHint(
      cmEditor,
      () => {
        const cursor = cmEditor.getCursor();
        const token = cmEditor.getTokenAt(cursor);
        if (!token.string) {
          return;
        }

        const words = segmenter.segment(token.string);
        const word = words.pop();
        const restWordsLength = words.reduce(
          (t: number, x: string) => t + x.length,
          0
        );

        const tokens = pickTokens(cmEditor);
        const suggestedTokens = selectSuggestedTokens(tokens, word);
        if (suggestedTokens.length === 0) {
          return;
        }

        return {
          list: suggestedTokens,
          from: CodeMirror.Pos(cursor.line, token.start + restWordsLength),
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
      callback: () => {
        this.execAutoComplete();
      },
    });
  }
}
