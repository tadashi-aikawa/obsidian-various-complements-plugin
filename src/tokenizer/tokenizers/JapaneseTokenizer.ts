import TinySegmenter from "../../external/tiny-segmenter";
import { TRIM_CHAR_PATTERN } from "./DefaultTokenizer";
import { Tokenizer } from "../tokenizer";
// @ts-ignore
const segmenter = new TinySegmenter();

function pickTokensAsJapanese(content: string, trimPattern: RegExp): string[] {
  return content
    .split(trimPattern)
    .filter((x) => x !== "")
    .flatMap<string>((x) => segmenter.segment(x));
}

/**
 * Japanese needs original logic.
 */
export class JapaneseTokenizer implements Tokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    return pickTokensAsJapanese(content, raw ? / /g : this.getTrimPattern());
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const tokens: string[] = segmenter
      .segment(content)
      // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/77
      .flatMap((x: string) =>
        x === " " ? x : x.split(" ").map((t) => (t === "" ? " " : t))
      );

    const ret = [];
    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i].length !== 1 ||
        !Boolean(tokens[i].match(this.getTrimPattern()))
      ) {
        ret.push({
          word: tokens.slice(i).join(""),
          offset: tokens.slice(0, i).join("").length,
        });
      }
    }

    return ret;
  }

  getTrimPattern(): RegExp {
    return TRIM_CHAR_PATTERN;
  }

  shouldIgnore(str: string): boolean {
    return Boolean(str.match(/^[ぁ-んａ-ｚＡ-Ｚ。、ー　]*$/));
  }
}
