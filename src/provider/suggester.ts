import {
  capitalizeFirstLetter,
  lowerStartsWithoutSpace,
  startsWithoutSpace,
} from "../util/strings";
import { IndexedWords } from "../ui/AutoCompleteSuggest";
import { uniqWith } from "../util/collection-helper";

export interface Word {
  value: string;
  description?: string;
  aliases?: string[];
  internalLink?: boolean;
}

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

function judge(
  word: Word,
  query: string,
  queryStartWithUpper: boolean
): Judgement {
  if (
    queryStartWithUpper &&
    !word.internalLink &&
    startsWithoutSpace(capitalizeFirstLetter(word.value), query)
  ) {
    const c = capitalizeFirstLetter(word.value);
    return { word: { ...word, value: c }, value: c, alias: false };
  }

  if (lowerStartsWithoutSpace(word.value, query)) {
    return { word: word, value: word.value, alias: false };
  }

  const matchedAlias = word.aliases?.find((a) =>
    lowerStartsWithoutSpace(a, query)
  );
  if (matchedAlias) {
    return { word: word, value: matchedAlias, alias: true };
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
        ...(indexedWords.customDictionary[query.charAt(0)] ?? []),
        ...(indexedWords.customDictionary[query.charAt(0).toLowerCase()] ?? []),
        ...(indexedWords.internalLink[query.charAt(0)] ?? []),
        ...(indexedWords.internalLink[query.charAt(0).toLowerCase()] ?? []),
      ]
    : [
        ...(indexedWords.currentFile[query.charAt(0)] ?? []),
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
      if (a.word.internalLink !== b.word.internalLink) {
        return b.word.internalLink ? 1 : -1;
      }
      if (a.alias !== b.alias) {
        return a.alias ? 1 : -1;
      }
      return 0;
    })
    .map((x) => x.word)
    .slice(0, max);

  // XXX: There is no guarantee that equals with max, but it is important for performance
  return uniqWith(candidate, (a, b) => a.value === b.value);
}
