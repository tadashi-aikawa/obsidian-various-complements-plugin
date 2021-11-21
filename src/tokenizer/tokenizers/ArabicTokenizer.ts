import { DefaultTokenizer } from "./DefaultTokenizer";

const ARABIC_TRIM_CHAR_PATTERN = /[\n\[\]()<>"'.,|;: `،؛]/g;
export class ArabicTokenizer extends DefaultTokenizer {
  getTrimPattern(): RegExp {
    return ARABIC_TRIM_CHAR_PATTERN;
  }
}
