import TinySegmenter from "./tiny-segmenter";
import CodeMirror from "codemirror";
// @ts-ignore
const segmenter = new TinySegmenter();

export type TokenizeStrategy = "default" | "japanese" | "arabic";

const TRIM_CHAR_PATTERN = /[\[\]()<>"'.,|; `]/g;
const ARABIC_TRIM_CHAR_PATTERN = /[\[\]()<>"'.,|; `،؛]/g;

function pickTokens(
  cmEditor: CodeMirror.Editor,
  trimPattern: RegExp
): string[] {
  const maxLineIndex = cmEditor.getDoc().lineCount();
  return [...Array(maxLineIndex).keys()]
    .flatMap((x) =>
      cmEditor
        .getLineTokens(x)
        .flatMap((x) =>
          x.type?.includes("hmd-codeblock") ? x.string.split(" ") : [x.string]
        )
    )
    .map((x) => x.replace(trimPattern, ""))
    .filter((x) => x !== "");
}

function pickTokensAsJapanese(cmEditor: CodeMirror.Editor): string[] {
  return cmEditor
    .getValue()
    .split(`\n`)
    .flatMap<string>((x) => segmenter.segment(x))
    .map((x) => x.replace(TRIM_CHAR_PATTERN, ""));
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
  protected readonly trimPattern: RegExp = TRIM_CHAR_PATTERN;

  constructor(cmEditor: CodeMirror.Editor) {
    this.cmEditor = cmEditor;
  }

  tokenize(): TokenizedResult | undefined {
    const cursor = this.cmEditor.getCursor();
    const token = this.cmEditor.getTokenAt(cursor);
    if (!token.string) {
      return undefined;
    }

    return {
      currentToken: token.string,
      currentTokenStart: token.start,
      tokens: pickTokens(this.cmEditor, this.trimPattern),
    };
  }
}

class ArabicTokenizer extends DefaultTokenizer {
  protected trimPattern: RegExp = ARABIC_TRIM_CHAR_PATTERN;
}

/**
 * Japanese needs original logic.
 */
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
    case "arabic":
      return new ArabicTokenizer(cmEditor);
    case "japanese":
      return new JapaneseTokenizer(cmEditor);
    default:
      throw new Error(`Unexpected strategy name: ${strategy}`);
  }
}
