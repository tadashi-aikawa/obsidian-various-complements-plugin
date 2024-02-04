import type { FactoryArgs } from "../tokenizer";
import { DefaultTokenizer } from "./DefaultTokenizer";

const INPUT_ARABIC_TRIM_CHAR_PATTERN = /[\n\t\[\]/:?!=()<>"'.,|;*~ `،؛]/g;
const INDEXING_ARABIC_TRIM_CHAR_PATTERN = /[\n\t\[\]$/:?!=()<>"'.,|;*~ `،؛]/g;

export class ArabicTokenizer extends DefaultTokenizer {
  constructor(_args?: FactoryArgs) {
    super();
    this.inputTrimCharPattern = INPUT_ARABIC_TRIM_CHAR_PATTERN;
    this.indexingTrimCharPattern = INDEXING_ARABIC_TRIM_CHAR_PATTERN;
  }
}
