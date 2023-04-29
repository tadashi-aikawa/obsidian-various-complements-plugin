import TinySegmenter from "../../external/tiny-segmenter";
import { TRIM_CHAR_PATTERN } from "./DefaultTokenizer";
import type { Tokenizer } from "../tokenizer";
import { joinNumberWithSymbol } from "../../util/strings";
// @ts-ignore
const segmenter = new TinySegmenter();

function pickTokensAsJapanese(content: string, trimPattern: RegExp): string[] {
  return joinNumberWithSymbol(
    content
      .split(trimPattern)
      .filter((x) => x !== "")
      .flatMap<string>((x) => segmenter.segment(x))
  );
}

/**
 * Japanese needs original logic.
 */
export class JapaneseTokenizer implements Tokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    return pickTokensAsJapanese(content, raw ? / /g : this.getTrimPattern());
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const tokens: string[] = joinNumberWithSymbol(
      segmenter
        .segment(content)
        // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/77
        .flatMap((x: string) =>
          x === " " ? x : x.split(" ").map((t) => (t === "" ? " " : t))
        )
    );

    const ret = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i === 0 || tokens[i].length !== 1 || tokens[i] !== " ") {
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

  shouldIgnoreOnCurrent(str: string): boolean {
    return Boolean(str.match(/^[ぁ-んａ-ｚＡ-Ｚ。、ー　]*$/));
  }
}
