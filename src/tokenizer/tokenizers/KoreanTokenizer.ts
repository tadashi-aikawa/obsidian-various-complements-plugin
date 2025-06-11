import { removeFromPattern } from "../../util/strings";
import type { FactoryArgs, TrimTarget } from "../tokenizer";
import { DefaultTokenizer } from "./DefaultTokenizer";

type PreviousType = "none" | "trim" | "korean" | "others";
const INPUT_TRIM_CHAR_PATTERN = /[\r\n\t\[\]$/:?!=<>"',|;*~ `_“„«»‹›‚‘’”。、『』「」《》〈〉]/g;
const INDEXING_TRIM_CHAR_PATTERN = /[\r\n\t\[\]$/:?!=<>"',|;*~ `_“„«»‹›‚‘’”。、『』「」《》〈〉]/g;
const KOREAN_PATTERN = /[\u1100-\u11FF\u3131-\u318E\uAC00-\uD7AF\uA960–\uA97F\uD7B0–\uD7FFA-Za-z0-9_\-\\]/;
export class KoreanTokenizer extends DefaultTokenizer {
  constructor(args?: FactoryArgs) {
    super();
    this.inputTrimCharPattern = args?.treatUnderscoreAsPartOfWord
      ? removeFromPattern(INPUT_TRIM_CHAR_PATTERN, "_")
      : INPUT_TRIM_CHAR_PATTERN;
    this.indexingTrimCharPattern = args?.treatUnderscoreAsPartOfWord
      ? removeFromPattern(INDEXING_TRIM_CHAR_PATTERN, "_")
      : INDEXING_TRIM_CHAR_PATTERN;
  }

  tokenize(content: string, raw?: boolean): string[] {
    const tokenized = Array.from(this._tokenize(content, "indexing")).filter(
      (x) => x.word.match(KOREAN_PATTERN),
    );
    return raw
      ? tokenized.map((x) => x.word)
      : tokenized
        .map((x) => x.word)
        .filter((x) => !x.match(this.getTrimPattern("indexing")));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const offsets = Array.from(this._tokenize(content, "input"))
      .filter((x) => !x.word.match(this.getTrimPattern("input")))
      .map((x) => x.offset);
    return [
      ...offsets.map((i) => ({
        word: content.slice(i),
        offset: i,
      })),
    ];
  }

  private *_tokenize(
    content: string,
    target: TrimTarget,
  ): Iterable<{ word: string; offset: number }> {
    let startIndex = 0;
    let previousType: PreviousType = "none";
    const trimPattern = super.getTrimPattern(target);

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === "(" || char === ")") {
        const isPrevSpace = i > 0 && content[i - 1] === " ";
        const isNextSpace = i < content.length - 1 && content[i + 1] === " ";

        if (isPrevSpace || isNextSpace) {
          yield { word: content.slice(startIndex, i), offset: startIndex };
          previousType = "trim";
          startIndex = i + 1;
          continue;
        } else {
          if (previousType === "korean" || previousType === "none") {
            previousType = "korean";
            continue;
          }
          yield { word: content.slice(startIndex, i), offset: startIndex };
          previousType = "korean";
          startIndex = i;
          continue;
        }
      }

      if (char.match(trimPattern)) {
        yield { word: content.slice(startIndex, i), offset: startIndex };
        previousType = "trim";
        startIndex = i;
        continue;
      }

      if (char.match(KOREAN_PATTERN)) {
        if (previousType === "korean" || previousType === "none") {
          previousType = "korean";
          continue;
        }

        yield { word: content.slice(startIndex, i), offset: startIndex };
        previousType = "korean";
        startIndex = i;
        continue;
      }

      if (previousType === "others" || previousType === "none") {
        previousType = "others";
        continue;
      }

      yield { word: content.slice(startIndex, i), offset: startIndex };
      previousType = "others";
      startIndex = i;
    }

    yield {
      word: content.slice(startIndex, content.length),
      offset: startIndex,
    };
  }
}
