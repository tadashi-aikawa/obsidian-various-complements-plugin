import { type Word, WordTypeMeta } from "../model/Word";
import type {
  HitWord,
  SelectionHistoryStorage,
} from "../storage/SelectionHistoryStorage";
import type { IndexedWords } from "../ui/AutoCompleteSuggest";
import { max, uniqWith } from "../util/collection-helper";
import {
  capitalizeFirstLetter,
  lowerFuzzy,
  lowerFuzzyStarsWith,
  lowerIncludes,
  lowerStartsWith,
  wrapFuzzy,
} from "../util/strings";

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
  word: Word,
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
  options?: {
    fuzzy?: {
      minMatchScore: number;
    };
  },
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

  const matcher = options?.fuzzy ? lowerFuzzy : wrapFuzzy(lowerStartsWith);

  const matched = matcher(word.value, query);
  if (
    matched.type === "concrete_match" ||
    (matched.type === "fuzzy_match" &&
      matched.score > options?.fuzzy?.minMatchScore!)
  ) {
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
          fuzzy: matched.type === "fuzzy_match",
          query,
        },
        value: c,
        alias: false,
      };
    } else {
      return {
        word: {
          ...word,
          hit: word.value,
          fuzzy: matched.type === "fuzzy_match",
          query,
        },
        value: word.value,
        alias: false,
      };
    }
  }

  const matchedAlias = word.aliases
    ?.map((a) => ({ aliases: a, matched: matcher(a, query) }))
    .sort((a, b) =>
      a.matched.type === "concrete_match" && b.matched.type !== "concrete_match"
        ? -1
        : 0,
    )
    .find((x) => x.matched.type !== "none");
  if (
    matchedAlias &&
    (matchedAlias.matched.type === "concrete_match" ||
      (matchedAlias.matched.type === "fuzzy_match" &&
        matchedAlias.matched.score > options?.fuzzy?.minMatchScore!))
  ) {
    return {
      word: {
        ...word,
        hit: matchedAlias.aliases,
        fuzzy: matchedAlias.matched.type === "fuzzy_match",
        query,
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
    fuzzy?: {
      minMatchScore: number;
    };
    providerMinChars?: {
      currentFile: number;
      currentVault: number;
      customDictionary: number;
      internalLink: number;
    };
    globalMinChar?: number;
  } = {},
): Word[] {
  const { frontMatter, selectionHistoryStorage, providerMinChars, globalMinChar } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  // プロバイダー別の最小文字数チェック関数
  const shouldIncludeProvider = (providerType: keyof NonNullable<typeof providerMinChars>): boolean => {
    if (!providerMinChars) {
      return true;
    }
    const minChars = providerMinChars[providerType] || globalMinChar || 0;
    return query.length >= minChars;
  };

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
          ...(shouldIncludeProvider('currentFile') ? (indexedWords.currentFile[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('currentFile') ? (indexedWords.currentFile[query.charAt(0).toLowerCase()] ?? []) : []),
          ...(shouldIncludeProvider('currentVault') ? (indexedWords.currentVault[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('currentVault') ? (indexedWords.currentVault[query.charAt(0).toLowerCase()] ?? []) : []),
          ...(shouldIncludeProvider('customDictionary') ? (indexedWords.customDictionary[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('customDictionary') ? (indexedWords.customDictionary[query.charAt(0).toLowerCase()] ?? []) : []),
          ...(shouldIncludeProvider('internalLink') ? (indexedWords.internalLink[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('internalLink') ? (indexedWords.internalLink[query.charAt(0).toLowerCase()] ?? []) : []),
        ]
    : frontMatter
      ? flattenFrontMatterWords()
      : [
          ...(shouldIncludeProvider('currentFile') ? (indexedWords.currentFile[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('currentFile') ? (indexedWords.currentFile[query.charAt(0).toUpperCase()] ?? []) : []),
          ...(shouldIncludeProvider('currentVault') ? (indexedWords.currentVault[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('currentVault') ? (indexedWords.currentVault[query.charAt(0).toUpperCase()] ?? []) : []),
          ...(shouldIncludeProvider('customDictionary') ? (indexedWords.customDictionary[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('customDictionary') ? (indexedWords.customDictionary[query.charAt(0).toUpperCase()] ?? []) : []),
          ...(shouldIncludeProvider('internalLink') ? (indexedWords.internalLink[query.charAt(0)] ?? []) : []),
          ...(shouldIncludeProvider('internalLink') ? (indexedWords.internalLink[query.charAt(0).toUpperCase()] ?? []) : []),
        ];

  const filteredJudgement = Array.from(words)
    .map((x) => judge(x, query, queryStartWithUpper, option))
    .filter((x) => x.value !== undefined);

  const latestUpdated = max(
    filteredJudgement.map(
      (x) =>
        selectionHistoryStorage?.getSelectionHistory(x.word as HitWord)
          ?.lastUpdated ?? 0,
    ),
    0,
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
          latestUpdated,
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
  options?: {
    fuzzy?: {
      minMatchScore: number;
    };
  },
): Judgement {
  if (query === "") {
    return {
      word: { ...word, hit: word.value },
      value: word.value,
      alias: false,
    };
  }

  const startsWithMatcher = options?.fuzzy
    ? lowerFuzzyStarsWith
    : wrapFuzzy(lowerStartsWith);
  const includesMatcher = options?.fuzzy
    ? lowerFuzzy
    : wrapFuzzy(lowerIncludes);

  const startsWithMatched = startsWithMatcher(word.value, query);
  if (
    startsWithMatched.type === "concrete_match" ||
    (startsWithMatched.type === "fuzzy_match" &&
      startsWithMatched.score > options?.fuzzy?.minMatchScore!)
  ) {
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
          fuzzy: startsWithMatched.type === "fuzzy_match",
          query,
        },
        value: c,
        alias: false,
      };
    } else {
      return {
        word: {
          ...word,
          hit: word.value,
          fuzzy: startsWithMatched.type === "fuzzy_match",
          query,
        },
        value: word.value,
        alias: false,
      };
    }
  }

  const startsWithAliasMatched = word.aliases
    ?.map((a) => ({ aliases: a, matched: startsWithMatcher(a, query) }))
    .sort((a, b) =>
      a.matched.type === "concrete_match" && b.matched.type !== "concrete_match"
        ? -1
        : 0,
    )
    .find((x) => x.matched.type !== "none");
  if (
    startsWithAliasMatched &&
    (startsWithAliasMatched.matched.type === "concrete_match" ||
      (startsWithAliasMatched.matched.type === "fuzzy_match" &&
        startsWithAliasMatched.matched.score > options?.fuzzy?.minMatchScore!))
  ) {
    return {
      word: {
        ...word,
        hit: startsWithAliasMatched.aliases,
        fuzzy: startsWithAliasMatched.matched.type === "fuzzy_match",
        query,
      },
      value: startsWithAliasMatched.aliases,
      alias: true,
    };
  }

  const includesMatched = includesMatcher(word.value, query);
  if (
    includesMatched &&
    (includesMatched.type === "concrete_match" ||
      (includesMatched.type === "fuzzy_match" &&
        includesMatched.score > options?.fuzzy?.minMatchScore!))
  ) {
    return {
      word: {
        ...word,
        hit: word.value,
        fuzzy: includesMatched.type === "fuzzy_match",
        query,
      },
      value: word.value,
      alias: false,
    };
  }

  const matchedAliasIncluded = word.aliases
    ?.map((a) => ({ aliases: a, matched: includesMatcher(a, query) }))
    .sort((a, b) =>
      a.matched.type === "concrete_match" && b.matched.type !== "concrete_match"
        ? -1
        : 0,
    )
    .find((x) => x.matched.type !== "none");
  if (
    matchedAliasIncluded &&
    (matchedAliasIncluded.matched.type === "concrete_match" ||
      (matchedAliasIncluded.matched.type === "fuzzy_match" &&
        matchedAliasIncluded.matched.score > options?.fuzzy?.minMatchScore!))
  ) {
    return {
      word: {
        ...word,
        hit: matchedAliasIncluded.aliases,
        fuzzy: matchedAliasIncluded.matched.type === "fuzzy_match",
        query,
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
    fuzzy?: {
      minMatchScore: number;
    };
    providerMinChars?: {
      currentFile: number;
      currentVault: number;
      customDictionary: number;
      internalLink: number;
    };
    globalMinChar?: number;
  } = {},
): Word[] {
  const { frontMatter, selectionHistoryStorage, providerMinChars, globalMinChar } = option;
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  // プロバイダー別の最小文字数チェック関数
  const shouldIncludeProvider = (providerType: keyof NonNullable<typeof providerMinChars>): boolean => {
    if (!providerMinChars) {
      return true;
    }
    const minChars = providerMinChars[providerType] || globalMinChar || 0;
    return query.length >= minChars;
  };

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
        ...(shouldIncludeProvider('currentFile') ? flatObjectValues(indexedWords.currentFile) : []),
        ...(shouldIncludeProvider('currentVault') ? flatObjectValues(indexedWords.currentVault) : []),
        ...(shouldIncludeProvider('customDictionary') ? flatObjectValues(indexedWords.customDictionary) : []),
        ...(shouldIncludeProvider('internalLink') ? flatObjectValues(indexedWords.internalLink) : []),
      ];
  const filteredJudgement = Array.from(words)
    .map((x) => judgeByPartialMatch(x, query, queryStartWithUpper, option))
    .filter((x) => x.value !== undefined);

  const latestUpdated = max(
    filteredJudgement.map(
      (x) =>
        selectionHistoryStorage?.getSelectionHistory(x.word as HitWord)
          ?.lastUpdated ?? 0,
    ),
    0,
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
          latestUpdated,
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
