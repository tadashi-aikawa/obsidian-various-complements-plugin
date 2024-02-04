import { splitRaw } from "../../util/strings";
import type { FactoryArgs } from "../tokenizer";
import { AbstractTokenizer } from "./AbstractTokenizer";

function pickTokens(content: string, trimPattern: RegExp): string[] {
  return content.split(trimPattern).filter((x) => x !== "");
}

export class DefaultTokenizer extends AbstractTokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    const tokens = raw
      ? Array.from(splitRaw(content, this.getTrimPattern("indexing"))).filter(
          (x) => x !== " "
        )
      : pickTokens(content, this.getTrimPattern("indexing"));
    return tokens.map((x) => x.replace(/\.+$/g, ""));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const trimIndexes = Array.from(
      content.matchAll(this.getTrimPattern("input"))
    )
      .sort((a, b) => a.index! - b.index!)
      .map((x) => x.index!);
    return [
      { word: content, offset: 0 },
      ...trimIndexes.map((i) => ({
        word: content.slice(i + 1),
        offset: i + 1,
      })),
    ];
  }
}
