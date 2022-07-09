import { ArabicTokenizer } from "./tokenizers/ArabicTokenizer";
import { DefaultTokenizer } from "./tokenizers/DefaultTokenizer";
import { JapaneseTokenizer } from "./tokenizers/JapaneseTokenizer";
import type { TokenizeStrategy } from "./TokenizeStrategy";
import { EnglishOnlyTokenizer } from "./tokenizers/EnglishOnlyTokenizer";
import type { App } from "obsidian";
import { ChineseTokenizer } from "./tokenizers/ChineseTokenizer";

export interface Tokenizer {
  tokenize(content: string, raw?: boolean): string[];
  recursiveTokenize(content: string): { word: string; offset: number }[];
  getTrimPattern(): RegExp;
  shouldIgnoreOnCurrent(query: string): boolean;
}

export async function createTokenizer(
  strategy: TokenizeStrategy,
  app: App
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
      const hasCedict = await app.vault.adapter.exists("./cedict_ts.u8");
      if (!hasCedict) {
        return Promise.reject(
          new Error("cedict_ts.U8 doesn't exist in your vault root.")
        );
      }
      const dict = await app.vault.adapter.read("./cedict_ts.u8");
      return ChineseTokenizer.create(dict);
  }
}
