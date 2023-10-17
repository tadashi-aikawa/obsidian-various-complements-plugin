import type { App } from "obsidian";

import { DefaultTokenizer } from "./tokenizers/DefaultTokenizer";
import { ArabicTokenizer } from "./tokenizers/ArabicTokenizer";
import { JapaneseTokenizer } from "./tokenizers/JapaneseTokenizer";
import type { TokenizeStrategy } from "./TokenizeStrategy";
import { EnglishOnlyTokenizer } from "./tokenizers/EnglishOnlyTokenizer";
import { ChineseTokenizer } from "./tokenizers/ChineseTokenizer";
import type { Settings } from "../setting/settings";

export type TrimTarget = "input" | "indexing";

export interface Tokenizer {
  tokenize(content: string, raw?: boolean): string[];
  recursiveTokenize(content: string): { word: string; offset: number }[];
  getTrimPattern(target: TrimTarget): RegExp;
  shouldIgnoreOnCurrent(query: string): boolean;
}

export async function createTokenizer(
  strategy: TokenizeStrategy,
  app: App,
  settings: Settings
): Promise<Tokenizer> {
  switch (strategy.name) {
    case "default":
      return new DefaultTokenizer();
    case "english-only":
      return new EnglishOnlyTokenizer();
    case "arabic":
      return new ArabicTokenizer();
    case "japanese":
      return new JapaneseTokenizer();
    case "chinese":
      const hasCedict = await app.vault.adapter.exists(settings.cedictPath);
      if (!hasCedict) {
        return Promise.reject(
          new Error(`cedict_ts.u8 doesn't exist in ${settings.cedictPath}.`)
        );
      }
      const dict = await app.vault.adapter.read(settings.cedictPath);
      return ChineseTokenizer.create(dict);
  }
}
