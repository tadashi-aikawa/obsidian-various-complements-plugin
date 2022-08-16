import {
  capitalizeFirstLetter,
  lowerIncludes,
  lowerStartsWith,
} from "../util/strings";
import type { IndexedWords } from "../ui/AutoCompleteSuggest";
import { max, uniqWith } from "../util/collection-helper";
import { type Word, WordTypeMeta } from "../model/Word";
import type {
  HitWord,
  SelectionHistoryStorage,
} from "../storage/SelectionHistoryStorage";

export type WordsByFirstLetter = { [firstLetter: string]: Word[] };

interface Judgement {
  // TODO: want to replace to HitWord
  word: Word;
  // TODO: remove value. use word.hit instead
  value?: string;
  alias: boolean;
}

export function pushWord(
  wordsByFirstLetter: WordsByFirstLetter,
  key: string,
  word: Word
) {
  if (wordsByFirstLetter[key] === undefined) {
    wordsByFirstLetter[key] = [word];
    return;
  }

  wordsByFirstLetter[key].push(word);
}

// Public for tests
export function judge(
  word: Word,
  query: string,
  queryStartWithUpper: boolean
): Judgement {
  if (query === "") {
    return {
      word: {
        ...word,
        hit: word.value,
      },
      value: word.value,
      alias: false,
    };
  }

  if (lowerStartsWith(word.value, query)) {
    if (
      queryStartWithUpper &&
      word.type !== "internalLink" &&
      word.type !== "frontMatter"
    ) {
      const c = capitalizeFirstLetter(word.value);
      return {
        word: {
          ...word,
          value: c,
          hit: c,
        },
        value: c,
        alias: false,
      };
    } else {
      return {
        word: {
          ...word,
          hit: word.value,
        },
        value: word.value,
        alias: false,
      };
    }
  }
  const matchedAlias = word.aliases?.find((a) => lowerStartsWith(a, query));
  if (matchedAlias) {
    return {
      word: {
        ...word,
        hit: matchedAlias,
      },
      value: matchedAlias,
      alias: true,
    };
  }

  return {
    word,
    alias: false,
  };
}

export function suggestWords(
  indexedWords: IndexedWords,
  query: string,
  maxNum: number,
  option: {
    frontMatter?: string;
    selectionHistoryStorage?: SelectionHistoryStorage;
  } = {}
): Word[] {
  const { frontMatter, selectionHistoryStorage } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  const flattenFrontMatterWords = () => {
    if (frontMatter === "alias" || frontMatter === "aliases") {
      return [];
    }
    if (frontMatter && indexedWords.frontMatter?.[frontMatter]) {
      return Object.values(indexedWords.frontMatter?.[frontMatter]).flat();
    }
    return [];
  };

  const words = queryStartWithUpper
    ? frontMatter
      ? flattenFrontMatterWords()
      : [
          ...(indexedWords.currentFile[query.charAt(0)] ?? []),
          ...(indexedWords.currentFile[query.charAt(0).toLowerCase()] ?? []),
          ...(indexedWords.currentVault[query.charAt(0)] ?? []),
          ...(indexedWords.currentVault[query.charAt(0).toLowerCase()] ?? []),
          ...(indexedWords.customDictionary[query.charAt(0)] ?? []),
          ...(indexedWords.customDictionary[query.charAt(0).toLowerCase()] ??
            []),
          ...(indexedWords.internalLink[query.charAt(0)] ?? []),
          ...(indexedWords.internalLink[query.charAt(0).toLowerCase()] ?? []),
        ]
    : frontMatter
    ? flattenFrontMatterWords()
    : [
        ...(indexedWords.currentFile[query.charAt(0)] ?? []),
        ...(indexedWords.currentFile[query.charAt(0).toUpperCase()] ?? []),
        ...(indexedWords.currentVault[query.charAt(0)] ?? []),
        ...(indexedWords.currentVault[query.charAt(0).toUpperCase()] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0)] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0).toUpperCase()] ?? []),
        ...(indexedWords.internalLink[query.charAt(0)] ?? []),
        ...(indexedWords.internalLink[query.charAt(0).toUpperCase()] ?? []),
      ];

  const filteredJudgement = Array.from(words)
    .map((x) => judge(x, query, queryStartWithUpper))
    .filter((x) => x.value !== undefined);

  const latestUpdated = max(
    filteredJudgement.map(
      (x) =>
        selectionHistoryStorage?.getSelectionHistory(x.word as HitWord)
          ?.lastUpdated ?? 0
    ),
    0
  );

  const candidate = filteredJudgement
    .sort((a, b) => {
      const aWord = a.word as HitWord;
      const bWord = b.word as HitWord;

      const notSameWordType = aWord.type !== bWord.type;
      if (frontMatter && notSameWordType) {
        return bWord.type === "frontMatter" ? 1 : -1;
      }

      if (selectionHistoryStorage) {
        const ret = selectionHistoryStorage.compare(
          aWord,
          bWord,
          latestUpdated
        );
        if (ret !== 0) {
          return ret;
        }
      }

      if (a.value!.length !== b.value!.length) {
        return a.value!.length > b.value!.length ? 1 : -1;
      }
      if (notSameWordType) {
        return WordTypeMeta.of(bWord.type).priority >
          WordTypeMeta.of(aWord.type).priority
          ? 1
          : -1;
      }
      if (a.alias !== b.alias) {
        return a.alias ? 1 : -1;
      }
      return 0;
    })
    .map((x) => x.word)
    .slice(0, maxNum);

  // XXX: There is no guarantee that equals with max, but it is important for performance
  return uniqWith(
    candidate,
    (a, b) =>
      a.value === b.value &&
      WordTypeMeta.of(a.type).group === WordTypeMeta.of(b.type).group
  );
}

// TODO: refactoring
// Public for tests
export function judgeByPartialMatch(
  word: Word,
  query: string,
  queryStartWithUpper: boolean
): Judgement {
  if (query === "") {
    return {
      word: { ...word, hit: word.value },
      value: word.value,
      alias: false,
    };
  }

  if (lowerStartsWith(word.value, query)) {
    if (
      queryStartWithUpper &&
      word.type !== "internalLink" &&
      word.type !== "frontMatter"
    ) {
      const c = capitalizeFirstLetter(word.value);
      return { word: { ...word, value: c, hit: c }, value: c, alias: false };
    } else {
      return {
        word: { ...word, hit: word.value },
        value: word.value,
        alias: false,
      };
    }
  }

  const matchedAliasStarts = word.aliases?.find((a) =>
    lowerStartsWith(a, query)
  );
  if (matchedAliasStarts) {
    return {
      word: { ...word, hit: matchedAliasStarts },
      value: matchedAliasStarts,
      alias: true,
    };
  }

  if (lowerIncludes(word.value, query)) {
    return {
      word: { ...word, hit: word.value },
      value: word.value,
      alias: false,
    };
  }

  const matchedAliasIncluded = word.aliases?.find((a) =>
    lowerIncludes(a, query)
  );
  if (matchedAliasIncluded) {
    return {
      word: { ...word, hit: matchedAliasIncluded },
      value: matchedAliasIncluded,
      alias: true,
    };
  }

  return { word: word, alias: false };
}

export function suggestWordsByPartialMatch(
  indexedWords: IndexedWords,
  query: string,
  maxNum: number,
  option: {
    frontMatter?: string;
    selectionHistoryStorage?: SelectionHistoryStorage;
  } = {}
): Word[] {
  const { frontMatter, selectionHistoryStorage } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  const flatObjectValues = (object: { [firstLetter: string]: Word[] }) =>
    Object.values(object).flat();

  const flattenFrontMatterWords = () => {
    if (frontMatter === "alias" || frontMatter === "aliases") {
      return [];
    }
    if (frontMatter && indexedWords.frontMatter?.[frontMatter]) {
      return Object.values(indexedWords.frontMatter?.[frontMatter]).flat();
    }
    return [];
  };

  const words = frontMatter
    ? flattenFrontMatterWords()
    : [
        ...flatObjectValues(indexedWords.currentFile),
        ...flatObjectValues(indexedWords.currentVault),
        ...flatObjectValues(indexedWords.customDictionary),
        ...flatObjectValues(indexedWords.internalLink),
      ];
  const filteredJudgement = Array.from(words)
    .map((x) => judgeByPartialMatch(x, query, queryStartWithUpper))
    .filter((x) => x.value !== undefined);

  const latestUpdated = max(
    filteredJudgement.map(
      (x) =>
        selectionHistoryStorage?.getSelectionHistory(x.word as HitWord)
          ?.lastUpdated ?? 0
    ),
    0
  );

  const candidate = filteredJudgement
    .sort((a, b) => {
      const aWord = a.word as HitWord;
      const bWord = b.word as HitWord;

      const notSameWordType = aWord.type !== bWord.type;
      if (frontMatter && notSameWordType) {
        return bWord.type === "frontMatter" ? 1 : -1;
      }

      if (selectionHistoryStorage) {
        const ret = selectionHistoryStorage.compare(
          aWord,
          bWord,
          latestUpdated
        );
        if (ret !== 0) {
          return ret;
        }
      }

      const as = lowerStartsWith(a.value!, query);
      const bs = lowerStartsWith(b.value!, query);
      if (as !== bs) {
        return bs ? 1 : -1;
      }

      if (a.value!.length !== b.value!.length) {
        return a.value!.length > b.value!.length ? 1 : -1;
      }
      if (notSameWordType) {
        return WordTypeMeta.of(bWord.type).priority >
          WordTypeMeta.of(aWord.type).priority
          ? 1
          : -1;
      }
      if (a.alias !== b.alias) {
        return a.alias ? 1 : -1;
      }
      return 0;
    })
    .map((x) => x.word)
    .slice(0, maxNum);

  // XXX: There is no guarantee that equals with max, but it is important for performance
  return uniqWith(
    candidate,
    (a, b) =>
      a.value === b.value &&
      WordTypeMeta.of(a.type).group === WordTypeMeta.of(b.type).group
  );
}
