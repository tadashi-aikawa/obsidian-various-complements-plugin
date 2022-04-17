import type { Word } from "../model/Word";
import type { PartialRequired } from "../types";

export type HitWord = PartialRequired<Word, "hit" | "completionDistance">;

export type SelectionHistoryByValue = {
  [value: string]: {
    accumulatedCompletionDistance: number;
    lastUpdated: number;
  };
};

function word2Key(word: HitWord): string {
  return `${word.hit}/${word.type}`;
}

export class SelectionHistoryStorage {
  data: SelectionHistoryByValue;

  constructor(data: SelectionHistoryByValue = {}) {
    this.data = data;
  }

  increment(word: HitWord): void {
    const key = word2Key(word);

    const distance = word.completionDistance;
    if (this.data[key]) {
      this.data[key] = {
        accumulatedCompletionDistance:
          this.data[key].accumulatedCompletionDistance + distance + 1,
        lastUpdated: Date.now(),
      };
    } else {
      this.data[key] = {
        accumulatedCompletionDistance: distance + 1,
        lastUpdated: Date.now(),
      };
    }
  }

  compare(w1: HitWord, w2: HitWord): -1 | 0 | 1 {
    const distance1 =
      this.data[word2Key(w1)]?.accumulatedCompletionDistance ?? 0;
    const distance2 =
      this.data[word2Key(w2)]?.accumulatedCompletionDistance ?? 0;

    if (w1.hit.length - distance1 === w2.hit.length - distance2) {
      return 0;
    }

    return w1.hit.length - distance1 > w2.hit.length - distance2 ? 1 : -1;
  }
}
