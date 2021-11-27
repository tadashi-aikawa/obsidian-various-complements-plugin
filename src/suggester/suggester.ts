import { Word } from "../CustomDictionaryService";
import {
  capitalizeFirstLetter,
  lowerStartsWith,
  lowerStartsWithoutSpace,
  startsWithoutSpace,
} from "../util/strings";

interface Judgement {
  word: Word;
  value?: string;
  alias: boolean;
}

function judge(
  word: Word,
  query: string,
  queryStartWithUpper: boolean
): Judgement {
  if (word.value === query) {
    return { word: word, alias: false };
  }

  if (
    word.value.startsWith("[[")
      ? lowerStartsWithoutSpace(word.value.replace("[[", ""), query)
      : startsWithoutSpace(word.value, query)
  ) {
    return { word: word, value: word.value, alias: false };
  }

  if (
    queryStartWithUpper &&
    startsWithoutSpace(capitalizeFirstLetter(word.value), query)
  ) {
    word.value = capitalizeFirstLetter(word.value);
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
  words: Word[],
  query: string,
  max: number
): Word[] {
  const queryStartWithUpper = capitalizeFirstLetter(query) === query;
  return Array.from(words)
    .map((x) => judge(x, query, queryStartWithUpper))
    .filter((x) => x.value !== undefined)
    .sort((a, b) => {
      const aliasP = (Number(a.alias) - Number(b.alias)) * 10000;
      const startP =
        (Number(lowerStartsWith(b.value!, query)) -
          Number(lowerStartsWith(a.value!, query))) *
        1000;
      const lengthP = a.value!.length - b.value!.length;
      return aliasP + startP + lengthP;
    })
    .map((x) => x.word)
    .slice(0, max);
}
