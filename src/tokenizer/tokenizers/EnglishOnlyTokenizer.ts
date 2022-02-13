import { DefaultTokenizer } from "./DefaultTokenizer";

// XXX: Hack implementation. There are some problems especially in recursiveTokenize.
export const ENGLISH_ONLY_TRIM_CHAR_PATTERN = /[^a-zA-Z0-9_\-#@]/g;
export class EnglishOnlyTokenizer extends DefaultTokenizer {
  getTrimPattern(): RegExp {
    return ENGLISH_ONLY_TRIM_CHAR_PATTERN;
  }
}
