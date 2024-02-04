import { ExhaustiveError } from "../../errors";
import {
  type FactoryArgs,
  type Tokenizer,
  type TrimTarget,
} from "../tokenizer";

const INPUT_TRIM_CHAR_PATTERN = /[\n\t\[\]$/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;
const INDEXING_TRIM_CHAR_PATTERN = /[\n\t\[\]/:?!=()<>"',|;*~ `_“„«»‹›‚‘’”]/g;

export abstract class AbstractTokenizer implements Tokenizer {
  protected inputTrimCharPattern: RegExp;
  protected indexingTrimCharPattern: RegExp;

  constructor(_args?: FactoryArgs) {
    this.inputTrimCharPattern = INPUT_TRIM_CHAR_PATTERN;
    this.indexingTrimCharPattern = INDEXING_TRIM_CHAR_PATTERN;
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
