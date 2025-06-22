import { removeFromPattern } from "../../util/strings";
import type { FactoryArgs, TrimTarget } from "../tokenizer";
import { DefaultTokenizer } from "./DefaultTokenizer";

type TokenType = "none" | "trim" | "korean" | "hanja" | "others";

const INPUT_TRIM_CHAR_PATTERN =
  /[\r\n\t\[\]$/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”。、·ㆍ∼《》〈〉『』「」≪≫｢｣<>―～…]/;
const INDEXING_TRIM_CHAR_PATTERN =
  /[\r\n\t\[\]/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”。、·ㆍ∼《》〈〉『』「」≪≫｢｣<>―～…]/;

const HANGUL_JAMO = "\u1100-\u11FF";
const HANGUL_COMPATIBILITY_JAMO = "\u3130-\u318F";
const ENCLOSED_JAMO = "\u3200-\u321E\u3260-\u327F";
const CJK_COMPAT_KO = "\u3371-\u33FF";
const HANGUL_JAMO_EXTENDED_A = "\uA960-\uA97F";
const HANGUL_SYLLABLES = "\uAC00-\uD7AF";
const HANGUL_JAMO_EXTENDED_B = "\uD7B0-\uD7FF";
const HALFWIDTH_FULLWIDTH_FORMS_KO =
  "\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\uFFE0-\uFFE6\uFFE8-\uFFEE";
const EXTRA_WORD_CHARACTERS = "○×□";
const KOREAN_PATTERN = new RegExp(
  `[a-zA-Z0-9_\\-\\\\${HANGUL_JAMO}${HANGUL_COMPATIBILITY_JAMO}${ENCLOSED_JAMO}${CJK_COMPAT_KO}${HANGUL_JAMO_EXTENDED_A}${HANGUL_JAMO}${HANGUL_SYLLABLES}${HANGUL_JAMO_EXTENDED_B}${HALFWIDTH_FULLWIDTH_FORMS_KO}${EXTRA_WORD_CHARACTERS}]`,
);
const HANJA_PATTERN = /[\u4E00-\u9FFF0-9]/; // CJK unified ideographs

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
      (x) => x.type === "korean" || x.type === "hanja",
    );
    return raw
      ? tokenized.map((x) => x.word)
      : tokenized
          .map((x) => x.word)
          .filter((x) => !this.indexingTrimCharPattern.test(x));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const offsets = Array.from(this._tokenize(content, "input"))
      .filter((x) => !this.inputTrimCharPattern.test(x.word))
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
  ): Iterable<{ word: string; offset: number; type: TokenType }> {
    let startIndex = 0;
    let previousType: TokenType = "none";
    const trimPattern = super.getTrimPattern(target);

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (trimPattern.test(char)) {
        yield {
          word: content.slice(startIndex, i),
          offset: startIndex,
          type: previousType,
        };
        previousType = "trim";
        startIndex = i;
        continue;
      }

      if (KOREAN_PATTERN.test(char)) {
        if (previousType === "korean" || previousType === "none") {
          previousType = "korean";
          continue;
        }

        yield {
          word: content.slice(startIndex, i),
          offset: startIndex,
          type: previousType,
        };
        previousType = "korean";
        startIndex = i;
        continue;
      }

      if (HANJA_PATTERN.test(char)) {
        if (previousType === "hanja" || previousType === "none") {
          previousType = "hanja";
          continue;
        }

        yield {
          word: content.slice(startIndex, i),
          offset: startIndex,
          type: previousType,
        };
        previousType = "hanja";
        startIndex = i;
        continue;
      }

      if (previousType === "others" || previousType === "none") {
        previousType = "others";
        continue;
      }

      yield {
        word: content.slice(startIndex, i),
        offset: startIndex,
        type: previousType,
      };
      previousType = "others";
      startIndex = i;
    }

    yield {
      word: content.slice(startIndex, content.length),
      offset: startIndex,
      type: previousType,
    };
  }
}
