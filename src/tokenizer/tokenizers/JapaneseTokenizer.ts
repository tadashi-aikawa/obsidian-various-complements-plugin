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

  getTrimPattern(): RegExp {
    return TRIM_CHAR_PATTERN;
  }

  shouldIgnore(str: string): boolean {
    return Boolean(str.match(/^[ぁ-んａ-ｚＡ-Ｚ。、ー　]*$/));
  }
}
