import { DefaultTokenizer } from "./DefaultTokenizer";

export const ENGLISH_ONLY_TRIM_CHAR_PATTERN = /[^a-zA-Z0-9_-]/g;
export class EnglishOnlyTokenizer extends DefaultTokenizer {
  getTrimPattern(): RegExp {
    return ENGLISH_ONLY_TRIM_CHAR_PATTERN;
  }
}
