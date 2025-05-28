import type { Word } from "../model/Word";
import type { PartialRequired } from "../types";

export type HitWord = PartialRequired<Word, "hit">;
export type SelectionHistory = {
  count: number;
  lastUpdated: number;
};

export type SelectionHistoryTree = {
  [hit: string]: {
    [value: string]: {
      [type: string]: SelectionHistory;
    };
  };
};

const SEC = 1000;
const MIN = SEC * 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

function calcScore(
  history: SelectionHistory | undefined,
  latestUpdated: number,
): number {
  if (!history) {
    return 0;
  }

  if (history.lastUpdated === latestUpdated) {
    return Number.MAX_SAFE_INTEGER;
  }

  const behind = Date.now() - history.lastUpdated;

  // noinspection IfStatementWithTooManyBranchesJS
  if (behind < MIN) {
    return 8 * history.count;
  } else if (behind < HOUR) {
    return 4 * history.count;
  } else if (behind < DAY) {
    return 2 * history.count;
  } else if (behind < WEEK) {
    return 0.5 * history.count;
  } else {
    return 0.25 * history.count;
  }
}

export class SelectionHistoryStorage {
  data: SelectionHistoryTree;
  version: number;
  persistedVersion: number;
  // 0 means not defined
  maxDaysToKeepHistory: number;
  // 0 means not defined
  maxNumberOfHistoryToKeep: number;

  constructor(
    data: SelectionHistoryTree = {},
    maxDaysToKeepHistory: number,
    maxNumberOfHistoryToKeep: number,
  ) {
    this.data = data;

    const now = Date.now();
    this.version = now;
    this.persistedVersion = now;

    this.maxDaysToKeepHistory = maxDaysToKeepHistory;
    this.maxNumberOfHistoryToKeep = maxNumberOfHistoryToKeep;
  }

  // noinspection FunctionWithMultipleLoopsJS
  purge() {
    const now = Date.now();
    const times: number[] = [];

    for (const hit of Object.keys(this.data)) {
      for (const value of Object.keys(this.data[hit])) {
        for (const kind of Object.keys(this.data[hit][value])) {
          if (
            this.maxDaysToKeepHistory &&
            now - this.data[hit][value][kind].lastUpdated >
              this.maxDaysToKeepHistory * DAY
          ) {
            delete this.data[hit][value][kind];
          } else {
            times.push(this.data[hit][value][kind].lastUpdated);
          }
        }

        if (Object.isEmpty(this.data[hit][value])) {
          delete this.data[hit][value];
        }
      }

      if (Object.isEmpty(this.data[hit])) {
        delete this.data[hit];
      }
    }

    if (this.maxNumberOfHistoryToKeep) {
      const threshold =
        times
          .sort((a, b) => (a > b ? -1 : 1))
          .slice(0, this.maxNumberOfHistoryToKeep)
          .at(-1) ?? 0;

      for (const hit of Object.keys(this.data)) {
        for (const value of Object.keys(this.data[hit])) {
          for (const kind of Object.keys(this.data[hit][value])) {
            if (this.data[hit][value][kind].lastUpdated < threshold) {
              delete this.data[hit][value][kind];
            }
          }

          if (Object.isEmpty(this.data[hit][value])) {
            delete this.data[hit][value];
          }
        }

        if (Object.isEmpty(this.data[hit])) {
          delete this.data[hit];
        }
      }
    }
  }

  getSelectionHistory(word: HitWord): SelectionHistory | undefined {
    return this.data[word.hit]?.[word.value]?.[word.type];
  }

  increment(word: HitWord): void {
    if (!this.data[word.hit]) {
      this.data[word.hit] = {};
    }

    let valueRef;
    if (word.valueForHistory) {
      if (!this.data[word.hit][word.valueForHistory]) {
        this.data[word.hit][word.valueForHistory] = {};
      }
      valueRef = this.data[word.hit][word.valueForHistory];
    } else {
      if (!this.data[word.hit][word.value]) {
        this.data[word.hit][word.value] = {};
      }
      valueRef = this.data[word.hit][word.value];
    }

    if (valueRef[word.type]) {
      valueRef[word.type] = {
        count: valueRef[word.type].count + 1,
        lastUpdated: Date.now(),
      };
    } else {
      valueRef[word.type] = {
        count: 1,
        lastUpdated: Date.now(),
      };
    }

    this.version = Date.now();
  }

  compare(w1: HitWord, w2: HitWord, latestUpdated: number): -1 | 0 | 1 {
    const score1 = calcScore(this.getSelectionHistory(w1), latestUpdated);
    const score2 = calcScore(this.getSelectionHistory(w2), latestUpdated);

    if (score1 === score2) {
      return 0;
    }

    return score1 > score2 ? -1 : 1;
  }

  get shouldPersist(): boolean {
    return this.version > this.persistedVersion;
  }

  syncPersistVersion(): void {
    this.persistedVersion = this.version;
  }
}
