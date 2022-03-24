import type { Tokenizer } from "../tokenizer";
import { splitRaw } from "../../util/strings";

function pickTokens(content: string, trimPattern: RegExp): string[] {
  return content.split(trimPattern).filter((x) => x !== "");
}

export const TRIM_CHAR_PATTERN = /[\n\t\[\]$/:?!=()<>"'.,|;*~ `]/g;
export class DefaultTokenizer implements Tokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    return raw
      ? Array.from(splitRaw(content, this.getTrimPattern())).filter(
          (x) => x !== " "
        )
      : pickTokens(content, this.getTrimPattern());
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const trimIndexes = Array.from(content.matchAll(this.getTrimPattern()))
      .sort((a, b) => a.index! - b.index!)
      .map((x) => x.index!);
    return [
      { word: content, offset: 0 },
      ...trimIndexes.map((i) => ({
        word: content.slice(i + 1),
        offset: i + 1,
      })),
    ];
  }

  getTrimPattern(): RegExp {
    return TRIM_CHAR_PATTERN;
  }

  shouldIgnore(str: string): boolean {
    return false;
  }
}
