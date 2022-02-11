import {
  capitalizeFirstLetter,
  lowerIncludes,
  lowerStartsWith,
} from "../util/strings";
import { IndexedWords } from "../ui/AutoCompleteSuggest";
import { uniqWith } from "../util/collection-helper";
import { Word } from "../model/Word";

export type WordsByFirstLetter = { [firstLetter: string]: Word[] };

interface Judgement {
  word: Word;
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
  if (lowerStartsWith(word.value, query)) {
    if (queryStartWithUpper && word.type !== "internalLink") {
      const c = capitalizeFirstLetter(word.value);
      return { word: { ...word, value: c }, value: c, alias: false };
    } else {
      return { word: word, value: word.value, alias: false };
    }
  }
  const matchedAlias = word.aliases?.find((a) => lowerStartsWith(a, query));
  if (matchedAlias) {
    return {
      word: { ...word },
      value: matchedAlias,
      alias: true,
    };
  }

  return { word: word, alias: false };
}

export function suggestWords(
  indexedWords: IndexedWords,
  query: string,
  max: number
): Word[] {
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  const words = queryStartWithUpper
    ? [
        ...(indexedWords.currentFile[query.charAt(0)] ?? []),
        ...(indexedWords.currentFile[query.charAt(0).toLowerCase()] ?? []),
        ...(indexedWords.currentVault[query.charAt(0)] ?? []),
        ...(indexedWords.currentVault[query.charAt(0).toLowerCase()] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0)] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0).toLowerCase()] ?? []),
        ...(indexedWords.internalLink[query.charAt(0)] ?? []),
        ...(indexedWords.internalLink[query.charAt(0).toLowerCase()] ?? []),
      ]
    : [
        ...(indexedWords.currentFile[query.charAt(0)] ?? []),
        ...(indexedWords.currentVault[query.charAt(0)] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0)] ?? []),
        ...(indexedWords.internalLink[query.charAt(0)] ?? []),
        ...(indexedWords.internalLink[query.charAt(0).toUpperCase()] ?? []),
      ];

  const candidate = Array.from(words)
    .map((x) => judge(x, query, queryStartWithUpper))
    .filter((x) => x.value !== undefined)
    .sort((a, b) => {
      if (a.value!.length !== b.value!.length) {
        return a.value!.length > b.value!.length ? 1 : -1;
      }
      if (a.word.type !== b.word.type) {
        return b.word.type === "internalLink" ? 1 : -1;
      }
      if (a.alias !== b.alias) {
        return a.alias ? 1 : -1;
      }
      return 0;
    })
    .map((x) => x.word)
    .slice(0, max);

  // XXX: There is no guarantee that equals with max, but it is important for performance
  return uniqWith(
    candidate,
    (a, b) => a.value === b.value && a.type === b.type
  );
}

// TODO: refactoring
// Public for tests
export function judgeByPartialMatch(
  word: Word,
  query: string,
  queryStartWithUpper: boolean
): Judgement {
  if (lowerStartsWith(word.value, query)) {
    if (queryStartWithUpper && word.type !== "internalLink") {
      const c = capitalizeFirstLetter(word.value);
      return { word: { ...word, value: c }, value: c, alias: false };
    } else {
      return { word: word, value: word.value, alias: false };
    }
  }

  const matchedAliasStarts = word.aliases?.find((a) =>
    lowerStartsWith(a, query)
  );
  if (matchedAliasStarts) {
    return {
      word: { ...word },
      value: matchedAliasStarts,
      alias: true,
    };
  }

  if (lowerIncludes(word.value, query)) {
    return { word: word, value: word.value, alias: false };
  }

  const matchedAliasIncluded = word.aliases?.find((a) =>
    lowerIncludes(a, query)
  );
  if (matchedAliasIncluded) {
    return {
      word: { ...word },
      value: matchedAliasIncluded,
      alias: true,
    };
  }

  return { word: word, alias: false };
}

export function suggestWordsByPartialMatch(
  indexedWords: IndexedWords,
  query: string,
  max: number
): Word[] {
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;

  const flatObjectValues = (object: { [firstLetter: string]: Word[] }) =>
    Object.values(object).flat();
  const words = [
    ...flatObjectValues(indexedWords.currentFile),
    ...flatObjectValues(indexedWords.currentVault),
    ...flatObjectValues(indexedWords.customDictionary),
    ...flatObjectValues(indexedWords.internalLink),
  ];

  const candidate = Array.from(words)
    .map((x) => judgeByPartialMatch(x, query, queryStartWithUpper))
    .filter((x) => x.value !== undefined)
    .sort((a, b) => {
      const as = lowerStartsWith(a.value!, query);
      const bs = lowerStartsWith(b.value!, query);
      if (as !== bs) {
        return bs ? 1 : -1;
      }
      if (a.value!.length !== b.value!.length) {
        return a.value!.length > b.value!.length ? 1 : -1;
      }
      if (a.word.type !== b.word.type) {
        return b.word.type === "internalLink" ? 1 : -1;
      }
      if (a.alias !== b.alias) {
        return a.alias ? 1 : -1;
      }
      return 0;
    })
    .map((x) => x.word)
    .slice(0, max);

  // XXX: There is no guarantee that equals with max, but it is important for performance
  return uniqWith(
    candidate,
    (a, b) => a.value === b.value && a.type === b.type
  );
}
