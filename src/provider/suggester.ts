import {
  capitalizeFirstLetter,
  lowerFuzzy,
  lowerFuzzyStarsWith,
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

export interface Judgement {
  // TODO: want to replace to HitWord
  word: Word;
  // TODO: remove value. use word.hit instead
  value?: string;
  alias: boolean;
}

export function suggestionUniqPredicate(a: Word, b: Word) {
  if (a.value !== b.value) {
    return false;
  }

  if (WordTypeMeta.of(a.type).group !== WordTypeMeta.of(b.type).group) {
    return false;
  }

  if (
    a.type === "internalLink" &&
    !a.phantom &&
    a.createdPath !== b.createdPath
  ) {
    return false;
  }

  return true;
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
  queryStartWithUpper: boolean,
  fuzzy: boolean
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

  const matcher = fuzzy ? lowerFuzzy : lowerStartsWith;

  const matched = matcher(word.value, query);
  if (matched) {
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
          fuzzy: matched === "fuzzy",
        },
        value: c,
        alias: false,
      };
    } else {
      return {
        word: {
          ...word,
          hit: word.value,
          fuzzy: matched === "fuzzy",
        },
        value: word.value,
        alias: false,
      };
    }
  }

  const matchedAlias = word.aliases
    ?.map((a) => ({ aliases: a, matched: matcher(a, query) }))
    .find((x) => x.matched);
  if (matchedAlias?.matched) {
    return {
      word: {
        ...word,
        hit: matchedAlias.aliases,
        fuzzy: matchedAlias.matched === "fuzzy",
      },
      value: matchedAlias.aliases,
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
    fuzzy?: boolean;
  } = {}
): Word[] {
  const { frontMatter, selectionHistoryStorage } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;
  const fuzzy = option.fuzzy ?? false;

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
    .map((x) => judge(x, query, queryStartWithUpper, fuzzy))
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

      if (a.word.fuzzy !== b.word.fuzzy) {
        return a.word.fuzzy ? 1 : -1;
      }

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
  return uniqWith(candidate, suggestionUniqPredicate);
}

// TODO: refactoring
// Public for tests
export function judgeByPartialMatch(
  word: Word,
  query: string,
  queryStartWithUpper: boolean,
  fuzzy: boolean
): Judgement {
  if (query === "") {
    return {
      word: { ...word, hit: word.value },
      value: word.value,
      alias: false,
    };
  }

  const startsWithMatcher = fuzzy ? lowerFuzzyStarsWith : lowerStartsWith;
  const includesMatcher = fuzzy ? lowerFuzzy : lowerIncludes;

  const startsWithMatched = startsWithMatcher(word.value, query);
  if (startsWithMatched) {
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
          fuzzy: startsWithMatched === "fuzzy",
        },
        value: c,
        alias: false,
      };
    } else {
      return {
        word: {
          ...word,
          hit: word.value,
          fuzzy: startsWithMatched === "fuzzy",
        },
        value: word.value,
        alias: false,
      };
    }
  }

  const startsWithAliasMatched = word.aliases
    ?.map((a) => ({ aliases: a, matched: startsWithMatcher(a, query) }))
    .find((x) => x.matched);
  if (startsWithAliasMatched) {
    return {
      word: {
        ...word,
        hit: startsWithAliasMatched.aliases,
        fuzzy: startsWithAliasMatched.matched === "fuzzy",
      },
      value: startsWithAliasMatched.aliases,
      alias: true,
    };
  }

  const includesMatched = includesMatcher(word.value, query);
  if (includesMatched) {
    return {
      word: { ...word, hit: word.value, fuzzy: includesMatched === "fuzzy" },
      value: word.value,
      alias: false,
    };
  }

  const matchedAliasIncluded = word.aliases
    ?.map((a) => ({ aliases: a, matched: includesMatcher(a, query) }))
    .find((x) => x.matched);
  if (matchedAliasIncluded) {
    return {
      word: {
        ...word,
        hit: matchedAliasIncluded.aliases,
        fuzzy: matchedAliasIncluded.matched === "fuzzy",
      },
      value: matchedAliasIncluded.aliases,
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
    fuzzy?: boolean;
  } = {}
): Word[] {
  const { frontMatter, selectionHistoryStorage } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;
  const fuzzy = option.fuzzy ?? false;

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
    .map((x) => judgeByPartialMatch(x, query, queryStartWithUpper, fuzzy))
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

      if (a.word.fuzzy !== b.word.fuzzy) {
        return a.word.fuzzy ? 1 : -1;
      }

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
  return uniqWith(candidate, suggestionUniqPredicate);
}
