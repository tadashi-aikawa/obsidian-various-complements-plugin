import type { App } from "obsidian";

import type { Settings } from "../setting/settings";
import { ArabicTokenizer } from "./tokenizers/ArabicTokenizer";
import { ChineseTokenizer } from "./tokenizers/ChineseTokenizer";
import { DefaultTokenizer } from "./tokenizers/DefaultTokenizer";
import { EnglishOnlyTokenizer } from "./tokenizers/EnglishOnlyTokenizer";
import { JapaneseTokenizer } from "./tokenizers/JapaneseTokenizer";
import { KoreanTokenizer } from "./tokenizers/KoreanTokenizer";
import type { TokenizeStrategy } from "./TokenizeStrategy";

export type TrimTarget = "input" | "indexing";

export interface FactoryArgs {
  treatUnderscoreAsPartOfWord?: boolean;
}

export interface Tokenizer {
  tokenize(content: string, raw?: boolean): string[];
  recursiveTokenize(content: string): { word: string; offset: number }[];
  getTrimPattern(target: TrimTarget): RegExp;
  shouldIgnoreOnCurrent(query: string): boolean;
}

export async function createTokenizer(
  strategy: TokenizeStrategy,
  app: App,
  settings: Settings,
): Promise<Tokenizer> {
  switch (strategy.name) {
    case "default":
      return new DefaultTokenizer({
        treatUnderscoreAsPartOfWord: settings.treatUnderscoreAsPartOfWord,
      });
    case "english-only":
      return new EnglishOnlyTokenizer({
        treatUnderscoreAsPartOfWord: settings.treatUnderscoreAsPartOfWord,
      });
    case "arabic":
      return new ArabicTokenizer();
    case "japanese":
      return new JapaneseTokenizer();
    case "chinese":
      const hasCedict = await app.vault.adapter.exists(settings.cedictPath);
      if (!hasCedict) {
        return Promise.reject(
          new Error(`cedict_ts.u8 doesn't exist in ${settings.cedictPath}.`),
        );
      }
      const dict = await app.vault.adapter.read(settings.cedictPath);
      return ChineseTokenizer.create(dict);
    case "korean":
      return new KoreanTokenizer();
  }
}
