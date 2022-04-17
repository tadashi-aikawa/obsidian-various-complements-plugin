import type { Word } from "../model/Word";

export type SelectionHistoryByValue = {
  [value: string]: {
    accumulatedCompletionDistance: number;
    lastUpdated: number;
  };
};

export class SelectionHistoryStorage {
  data: SelectionHistoryByValue;

  constructor(data: SelectionHistoryByValue = {}) {
    this.data = data;
  }

  increment(word: Word): void {
    const distance = word.completionDistance ?? 0;

    if (this.data[word.value]) {
      this.data[word.value] = {
        accumulatedCompletionDistance:
          this.data[word.value].accumulatedCompletionDistance + distance,
        lastUpdated: Date.now(),
      };
    } else {
      this.data[word.value] = {
        accumulatedCompletionDistance: distance,
        lastUpdated: Date.now(),
      };
    }
  }

  compare(v1: string, v2: string): -1 | 0 | 1 {
    // const lastUpdated1 = this.data[v1]?.lastUpdated ?? 0;
    // const lastUpdated2 = this.data[v2]?.lastUpdated ?? 0;
    //
    // if (lastUpdated1 === lastUpdated2) {
    //   return 0;
    // }
    // return lastUpdated1 > lastUpdated2 ? -1 : 1;

    const distance1 = this.data[v1]?.accumulatedCompletionDistance ?? 0;
    const distance2 = this.data[v2]?.accumulatedCompletionDistance ?? 0;

    if (v1.length - distance1 === v2.length - distance2) {
      return 0;
    }

    return v1.length - distance1 > v2.length - distance2 ? 1 : -1;
  }
}
