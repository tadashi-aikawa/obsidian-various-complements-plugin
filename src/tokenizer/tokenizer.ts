import { ArabicTokenizer } from "./tokenizers/ArabicTokenizer";
import { DefaultTokenizer } from "./tokenizers/DefaultTokenizer";
import { JapaneseTokenizer } from "./tokenizers/JapaneseTokenizer";
import type { TokenizeStrategy } from "./TokenizeStrategy";
import { EnglishOnlyTokenizer } from "./tokenizers/EnglishOnlyTokenizer";

export interface Tokenizer {
  tokenize(content: string, raw?: boolean): string[];
  recursiveTokenize(content: string): { word: string; offset: number }[];
  getTrimPattern(): RegExp;
  shouldIgnore(query: string): boolean;
}

export function createTokenizer(strategy: TokenizeStrategy): Tokenizer {
  switch (strategy.name) {
    case "default":
      return new DefaultTokenizer();
    case "english-only":
      return new EnglishOnlyTokenizer();
    case "arabic":
      return new ArabicTokenizer();
    case "japanese":
      return new JapaneseTokenizer();
    default:
      throw new Error(`Unexpected strategy name: ${strategy}`);
  }
}
