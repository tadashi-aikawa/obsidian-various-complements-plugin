import { Tokenizer } from "../tokenizer";

function pickTokens(content: string, trimPattern: RegExp): string[] {
  return content.split(trimPattern).filter((x) => x !== "");
}

export const TRIM_CHAR_PATTERN = /[\n\t\\\[\]/:?!=()<>"'.,|;*~ `]/g;
export class DefaultTokenizer implements Tokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    return pickTokens(content, raw ? / /g : this.getTrimPattern());
  }

  getTrimPattern(): RegExp {
    return TRIM_CHAR_PATTERN;
  }

  shouldIgnore(str: string): boolean {
    return false;
  }
}
