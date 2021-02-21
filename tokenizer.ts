import TinySegmenter from "./tiny-segmenter";
import CodeMirror from "codemirror";
// @ts-ignore
const segmenter = new TinySegmenter();

export type TokenizeStrategy = "default" | "japanese";

function pickTokens(cmEditor: CodeMirror.Editor): string[] {
  const maxLineIndex = cmEditor.getDoc().lineCount();
  return [...Array(maxLineIndex).keys()]
    .flatMap((x) =>
      cmEditor
        .getLineTokens(x)
        .flatMap((x) =>
          x.type?.includes("hmd-codeblock") ? x.string.split(" ") : [x.string]
        )
    )
    .map((x) => x.replace(/[\[\]()<>"'.,|; `]/g, ""))
    .filter((x) => x !== "");
}

function pickTokensAsJapanese(cmEditor: CodeMirror.Editor): string[] {
  return cmEditor
    .getValue()
    .split(`\n`)
    .flatMap<string>((x) => segmenter.segment(x))
    .map((x) => x.replace(/[\[\]()<>"'.,|; `]/, ""));
}

interface TokenizedResult {
  currentToken: string;
  currentTokenStart: number;
  tokens: string[];
}

interface Tokenizer {
  /**
   * Return undefined if current token is empty.
   */
  tokenize(): TokenizedResult | undefined;
}

class DefaultTokenizer implements Tokenizer {
  private readonly cmEditor: CodeMirror.Editor;

  constructor(cmEditor: CodeMirror.Editor) {
    this.cmEditor = cmEditor;
  }

  tokenize(): TokenizedResult | undefined {
    const cursor = this.cmEditor.getCursor();
    const token = this.cmEditor.getTokenAt(cursor);
    if (!token.string) {
      return undefined;
    }

    console.log(pickTokens(this.cmEditor));
    return {
      currentToken: token.string,
      currentTokenStart: token.start,
      tokens: pickTokens(this.cmEditor),
    };
  }
}

class JapaneseTokenizer implements Tokenizer {
  private readonly cmEditor: CodeMirror.Editor;

  constructor(cmEditor: CodeMirror.Editor) {
    this.cmEditor = cmEditor;
  }

  tokenize(): TokenizedResult | undefined {
    const cursor = this.cmEditor.getCursor();
    const token = this.cmEditor.getTokenAt(cursor);
    if (!token.string) {
      return undefined;
    }

    const words = segmenter.segment(token.string);
    const currentToken = words.pop();
    const currentTokenStart =
      token.start + words.reduce((t: number, x: string) => t + x.length, 0);
    const tokens = pickTokensAsJapanese(this.cmEditor);

    return {
      currentToken,
      currentTokenStart,
      tokens,
    };
  }
}

export function createTokenizer(
  cmEditor: CodeMirror.Editor,
  strategy: TokenizeStrategy
): Tokenizer {
  switch (strategy) {
    case "default":
      return new DefaultTokenizer(cmEditor);
    case "japanese":
      return new JapaneseTokenizer(cmEditor);
    default:
      throw new Error(`Unexpected strategy name: ${strategy}`);
  }
}
