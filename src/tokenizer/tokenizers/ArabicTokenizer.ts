import { ExhaustiveError } from "../../errors";
import type { TrimTarget } from "../tokenizer";
import { DefaultTokenizer } from "./DefaultTokenizer";

const INPUT_ARABIC_TRIM_CHAR_PATTERN = /[\n\t\[\]/:?!=()<>"'.,|;*~ `،؛]/g;
const INDEXING_ARABIC_TRIM_CHAR_PATTERN = /[\n\t\[\]$/:?!=()<>"'.,|;*~ `،؛]/g;

export class ArabicTokenizer extends DefaultTokenizer {
  getTrimPattern(target: TrimTarget): RegExp {
    switch (target) {
      case "input":
        return INPUT_ARABIC_TRIM_CHAR_PATTERN;
      case "indexing":
        return INDEXING_ARABIC_TRIM_CHAR_PATTERN;
      default:
        throw new ExhaustiveError(target);
    }
  }
}
