import type { TrimTarget } from "../tokenizer";
import { AbstractTokenizer } from "./AbstractTokenizer";

type PreviousType = "none" | "trim" | "others";

export class DefaultTokenizer extends AbstractTokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    const tokenized = Array.from(this.__tokenize(content, "indexing"));
    return raw
      ? tokenized.map((x) => x.word)
      : tokenized
          .map((x) => x.word)
          .filter((x) => !x.match(this.getTrimPattern("indexing")))
          .map((x) => x.replace(/\.+$/g, ""));
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const offsets = Array.from(this.__tokenize(content, "input"))
      .filter((x) => !x.word.match(this.getTrimPattern("input")))
      .map((x) => x.offset);

    const results = offsets.map((i) => ({
      word: content.slice(i),
      offset: i,
    }));
    return results[0].offset === 0
      ? results
      : [{ word: content, offset: 0 }, ...results];
  }

  // Diffirent with _tokenize of other tokenizers
  private *__tokenize(
    content: string,
    target: TrimTarget,
  ): Iterable<{ word: string; offset: number }> {
    let startIndex = 0;
    let previousType: PreviousType = "none";

    for (let i = 0; i < content.length; i++) {
      if (content[i].match(super.getTrimPattern(target))) {
        const word = content.slice(startIndex, i);
        if (word !== "") {
          yield { word, offset: startIndex };
        }
        previousType = "trim";
        startIndex = i;
        continue;
      }

      if (previousType === "others" || previousType === "none") {
        previousType = "others";
        continue;
      }

      yield { word: content.slice(startIndex, i), offset: startIndex };
      previousType = "others";
      startIndex = i;
    }

    yield {
      word: content.slice(startIndex, content.length),
      offset: startIndex,
    };
  }
}
