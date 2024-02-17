import { removeFromPattern } from "../../util/strings";
import { ExhaustiveError } from "../../errors";
import {
  type FactoryArgs,
  type Tokenizer,
  type TrimTarget,
} from "../tokenizer";

const INPUT_TRIM_CHAR_PATTERN = /[\r\n\t\[\]$/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;
const INDEXING_TRIM_CHAR_PATTERN = /[\r\n\t\[\]/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;

export abstract class AbstractTokenizer implements Tokenizer {
  protected inputTrimCharPattern: RegExp;
  protected indexingTrimCharPattern: RegExp;

  constructor(args?: FactoryArgs) {
    this.inputTrimCharPattern = args?.treatUnderscoreAsPartOfWord
      ? removeFromPattern(INPUT_TRIM_CHAR_PATTERN, "_")
      : INPUT_TRIM_CHAR_PATTERN;
    this.indexingTrimCharPattern = args?.treatUnderscoreAsPartOfWord
      ? removeFromPattern(INDEXING_TRIM_CHAR_PATTERN, "_")
      : INDEXING_TRIM_CHAR_PATTERN;
  }

  getTrimPattern(target: TrimTarget): RegExp {
    switch (target) {
      case "input":
        return this.inputTrimCharPattern;
      case "indexing":
        return this.indexingTrimCharPattern;
      default:
        throw new ExhaustiveError(target);
    }
  }

  shouldIgnoreOnCurrent(_str: string): boolean {
    return false;
  }

  abstract tokenize(content: string, raw?: boolean): string[];

  abstract recursiveTokenize(
    content: string
  ): { word: string; offset: number }[];
}
