import { Tokenizer } from "../tokenizer";

function pickTokens(content: string, trimPattern: RegExp): string[] {
  return content
    .split(trimPattern)
    .map((x) => x.replace(trimPattern, ""))
    .filter((x) => x !== "");
}

export const TRIM_CHAR_PATTERN = /[\n\[\]()<>"'.,|;: `]/g;
export class DefaultTokenizer implements Tokenizer {
  tokenize(content: string): string[] {
    return pickTokens(content, this.getTrimPattern());
  }

  getTrimPattern(): RegExp {
    return TRIM_CHAR_PATTERN;
  }
}
