import TinySegmenter from "../../external/tiny-segmenter";
import { TRIM_CHAR_PATTERN } from "./DefaultTokenizer";
import { Tokenizer } from "../tokenizer";
// @ts-ignore
const segmenter = new TinySegmenter();

function pickTokensAsJapanese(content: string, trimPattern: RegExp): string[] {
  return content
    .split(trimPattern)
    .flatMap<string>((x) => segmenter.segment(x))
    .map((x) => x.replace(trimPattern, ""));
}

/**
 * Japanese needs original logic.
 */
export class JapaneseTokenizer implements Tokenizer {
  tokenize(content: string): string[] {
    return pickTokensAsJapanese(content, TRIM_CHAR_PATTERN);
  }
}
