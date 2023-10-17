import { type Tokenizer, type TrimTarget } from "../tokenizer";
import { splitRaw } from "../../util/strings";
import { ExhaustiveError } from "../../errors";

function pickTokens(content: string, trimPattern: RegExp): string[] {
  return content.split(trimPattern).filter((x) => x !== "");
}

const INPUT_TRIM_CHAR_PATTERN = /[\n\t\[\]$/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;
const INDEXING_TRIM_CHAR_PATTERN = /[\n\t\[\]/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;

export function getTrimPattern(target: TrimTarget): RegExp {
  switch (target) {
    case "input":
      return INPUT_TRIM_CHAR_PATTERN;
    case "indexing":
      return INDEXING_TRIM_CHAR_PATTERN;
    default:
      throw new ExhaustiveError(target);
  }
}

export class DefaultTokenizer implements Tokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    const tokens = raw
      ? Array.from(splitRaw(content, this.getTrimPattern("indexing"))).filter(
          (x) => x !== " "
        )
      : pickTokens(content, this.getTrimPattern("indexing"));
    return tokens.map((x) => x.replace(/\.+$/g, ""));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const trimIndexes = Array.from(
      content.matchAll(this.getTrimPattern("input"))
    )
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

  getTrimPattern(target: TrimTarget): RegExp {
    return getTrimPattern(target);
  }

  shouldIgnoreOnCurrent(str: string): boolean {
    return false;
  }
}
