import {
  judge,
  judgeByPartialMatch,
  pushWord,
  suggestWords,
  suggestWordsByPartialMatch,
  type WordsByFirstLetter,
} from "./suggester";
import { describe, expect, test } from "@jest/globals";
import type { IndexedWords } from "../ui/AutoCompleteSuggest";
import type { Word } from "src/model/Word";
import type { Judgement } from "./suggester";

describe("pushWord", () => {
  const createWordsByFirstLetter = (): WordsByFirstLetter => ({
    a: [
      { value: "aaa", type: "currentFile", createdPath: "" },
      { value: "aa", type: "currentFile", createdPath: "" },
    ],
  });

  test("add", () => {
    const wordsByFirstLetter = createWordsByFirstLetter();
    pushWord(wordsByFirstLetter, "u", {
      value: "uuu",
      type: "currentFile",
      createdPath: "",
    });
    expect(wordsByFirstLetter).toStrictEqual({
      a: [
        { value: "aaa", type: "currentFile", createdPath: "" },
        { value: "aa", type: "currentFile", createdPath: "" },
      ],
      u: [{ value: "uuu", type: "currentFile", createdPath: "" }],
    });
  });

  test("push", () => {
    const wordsByFirstLetter = createWordsByFirstLetter();
    pushWord(wordsByFirstLetter, "a", {
      value: "a",
      type: "currentFile",
      createdPath: "",
    });
    expect(wordsByFirstLetter).toStrictEqual({
      a: [
        { value: "aaa", type: "currentFile", createdPath: "" },
        { value: "aa", type: "currentFile", createdPath: "" },
        { value: "a", type: "currentFile", createdPath: "" },
      ],
    });
  });
});

describe.each<{
  word: Word;
  query: string;
  queryStartWithUpper: boolean;
  fuzzy: number | false;
  expected: Judgement;
}>`
  word                                                                   | query   | queryStartWithUpper | fuzzy    | expected
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bc"} | ${false}            | ${false} | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bd"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"cb"} | ${false}            | ${0}     | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", aliases: ["abc"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"bc"} | ${false}            | ${false} | ${{ word: { value: "abcde", aliases: ["abc"], type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"ac"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", aliases: ["abc"], type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"cb"} | ${false}            | ${0}     | ${{ word: { value: "abcde", aliases: ["abc"], type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"bd"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"Ab"} | ${true}             | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Ab"} | ${true}             | ${false} | ${{ value: "Abcde", word: { value: "Abcde", hit: "Abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bd"} | ${true}             | ${0}     | ${{ value: "Abcde", word: { value: "Abcde", hit: "Abcde", type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bc"} | ${true}             | ${false} | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Ab"} | ${true}             | ${false} | ${{ value: "abc", word: { value: "ce", hit: "abc", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bc"} | ${true}             | ${false} | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bb"} | ${true}             | ${0}     | ${{ value: "abab", word: { value: "ce", hit: "abab", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: true }, alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bb"} | ${true}             | ${1}     | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"ce"} | ${false}            | ${false} | ${{ value: "ce", word: { value: "ce", hit: "ce", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"ce"} | ${false}            | ${0}     | ${{ value: "ce", word: { value: "ce", hit: "ce", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${true}             | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
`("judge", ({ word, query, queryStartWithUpper, fuzzy, expected }) => {
  test(`judge(${JSON.stringify(
    word,
  )}, ${query}, ${queryStartWithUpper}, ${fuzzy}) = ${JSON.stringify(
    expected,
  )}`, () => {
    expect(
      judge(word, query, queryStartWithUpper, {
        fuzzy: fuzzy === false ? undefined : { minMatchScore: fuzzy },
      }),
    ).toStrictEqual(expected);
  });
});

describe.each<{
  word: Word;
  query: string;
  queryStartWithUpper: boolean;
  fuzzy: number | false;
  expected: Judgement;
}>`
  word                                                                   | query   | queryStartWithUpper | fuzzy    | expected
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bc"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bd"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"cb"} | ${false}            | ${0}     | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", aliases: ["abc"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"bc"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", aliases: ["abc"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"ac"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", aliases: ["abc"], type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", aliases: ["abc"], type: "customDictionary" }}      | ${"cb"} | ${false}            | ${0}     | ${{ word: { value: "abcde", aliases: ["abc"], type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"ab"} | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"bd"} | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"Ab"} | ${true}             | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "internalLink", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Ab"} | ${true}             | ${false} | ${{ value: "Abcde", word: { value: "Abcde", hit: "Abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bd"} | ${true}             | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: true }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bc"} | ${true}             | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Ab"} | ${true}             | ${false} | ${{ value: "abc", word: { value: "ce", hit: "abc", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bc"} | ${true}             | ${false} | ${{ value: "abc", word: { value: "ce", hit: "abc", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bb"} | ${true}             | ${0}     | ${{ value: "abab", word: { value: "ce", hit: "abab", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: true }, alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bb"} | ${true}             | ${1}     | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"ce"} | ${false}            | ${false} | ${{ value: "ce", word: { value: "ce", hit: "ce", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"ce"} | ${false}            | ${0}     | ${{ value: "ce", word: { value: "ce", hit: "ce", aliases: ["abc", "abab"], type: "customDictionary", fuzzy: false }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${true}             | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${false}            | ${false} | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${""}   | ${false}            | ${0}     | ${{ value: "abcde", word: { value: "abcde", hit: "abcde", type: "customDictionary" }, alias: false }}
`(
  "judgeByPartialMatch",
  ({ word, query, queryStartWithUpper, fuzzy, expected }) => {
    test(`judgeByPartialMatch(${JSON.stringify(
      word,
    )}, ${query}, ${queryStartWithUpper}, ${fuzzy}) = ${JSON.stringify(
      expected,
    )}`, () => {
      expect(
        judgeByPartialMatch(word, query, queryStartWithUpper, {
          fuzzy: fuzzy === false ? undefined : { minMatchScore: fuzzy },
        }),
      ).toStrictEqual(expected);
    });
  },
);

describe("suggestWords", () => {
  const createIndexedWords = (): IndexedWords => ({
    currentFile: {
      a: [
        { value: "ai", type: "currentFile", createdPath: "" },
        { value: "aiUEO", type: "currentFile", createdPath: "" },
        { value: "Arc", type: "currentFile", createdPath: "" },
      ],
    },
    currentVault: {},
    customDictionary: {
      a: [
        {
          value: "uwaa",
          aliases: ["aaa"],
          type: "customDictionary",
          createdPath: "",
        },
        { value: "aiUEO", type: "customDictionary", createdPath: "" },
      ],
      A: [{ value: "AWS", type: "customDictionary", createdPath: "" }],
      u: [
        {
          value: "uwaa",
          aliases: ["aaa"],
          type: "customDictionary",
          createdPath: "",
        },
        {
          value: "uaaaaaaaaaaaaa",
          type: "customDictionary",
          createdPath: "",
        },
      ],
      U: [
        {
          value: "UFO",
          aliases: ["Unidentified flying object"],

          createdPath: "",
          type: "customDictionary",
        },
      ],
    },
    internalLink: {
      a: [
        { value: "aiUEO", type: "internalLink", createdPath: "" },
        {
          value: "あいうえお",
          type: "internalLink",
          aliases: ["aiueo"],
          createdPath: "",
        },
      ],
      A: [
        { value: "AWS", type: "internalLink", createdPath: "" },
        { value: "AI", type: "internalLink", createdPath: "a/AI.md" },
        { value: "AI", type: "internalLink", createdPath: "b/AI.md" },
      ],
      あ: [
        {
          value: "あいうえお",
          type: "internalLink",
          aliases: ["aiueo"],
          createdPath: "",
        },
      ],
    },
    frontMatter: {}, // TODO: Add value
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 10)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        type: "currentFile",
        hit: "ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "internalLink",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "customDictionary",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        aliases: ["aaa"],
        hit: "aaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Arc",
        type: "currentFile",
        hit: "Arc",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        aliases: ["aiueo"],
        hit: "aiueo",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "ai", 10)).toStrictEqual([
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        hit: "ai",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        aliases: ["aiueo"],
        hit: "aiueo",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "aiu", 10)).toStrictEqual([
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        aliases: ["aiueo"],
        hit: "aiueo",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: ua (fuzzy: true)", () => {
    const indexedWords = createIndexedWords();
    expect(
      suggestWords(indexedWords, "ua", 10, { fuzzy: { minMatchScore: 0 } }),
    ).toStrictEqual([
      {
        value: "uaaaaaaaaaaaaa",
        hit: "uaaaaaaaaaaaaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        aliases: ["aaa"],
        hit: "uwaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: true,
      },
    ]);
  });

  test("Query: ua (fuzzy: false)", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "ua", 10)).toStrictEqual([
      {
        value: "uaaaaaaaaaaaaa",
        hit: "uaaaaaaaaaaaaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "A", 10)).toStrictEqual([
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        hit: "Ai",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        hit: "AWS",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        hit: "AWS",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
        hit: "aaa",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Arc",
        type: "currentFile",
        hit: "Arc",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        hit: "AiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "Ai", 10)).toStrictEqual([
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        hit: "Ai",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        hit: "aiueo",
        type: "internalLink",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        hit: "AiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AI", 10)).toStrictEqual([
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        hit: "Ai",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        hit: "aiueo",
        type: "internalLink",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        hit: "AiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AIU", 10)).toStrictEqual([
      {
        value: "aiUEO",
        hit: "aiUEO",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        hit: "aiueo",
        type: "internalLink",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        hit: "AiUEO",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "u", 10)).toStrictEqual([
      {
        value: "UFO",
        hit: "UFO",
        type: "customDictionary",
        aliases: ["Unidentified flying object"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        hit: "uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uaaaaaaaaaaaaa",
        hit: "uaaaaaaaaaaaaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "U", 10)).toStrictEqual([
      {
        value: "UFO",
        hit: "UFO",
        type: "customDictionary",
        aliases: ["Unidentified flying object"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Uwaa",
        hit: "Uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Uaaaaaaaaaaaaa",
        hit: "Uaaaaaaaaaaaaa",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 3)).toStrictEqual([
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        hit: "AI",
        type: "internalLink",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        hit: "ai",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
      // {
      //   value: "AWS",
      //   hit: "AWS",
      //   type: "internalLink",
      //   createdPath: "",
      // },
      // --- hidden ---
      // { value: "uwaa", type: "customDictionary", aliases: ["aaa"] },
      // { value: "aiUEO", type: "internalLink" },
      // { value: "あいうえお", type: "internalLink", aliases: ["aiueo"] },
      // { value: "aiUEO", type: "customDictionary" },
      // { value: "aiUEO", type: "currentFile" },
    ]);
  });

  const indexedWords2: IndexedWords = {
    frontMatter: {
      tags: {
        a: [
          {
            key: "tags",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "tags",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
      alias: {
        a: [
          {
            key: "alias",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "alias",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
      aliases: {
        a: [
          {
            key: "aliases",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "aliases",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
    },
    internalLink: {
      a: [
        { value: "a", type: "internalLink", createdPath: "", fuzzy: false },
        { value: "a", type: "internalLink", createdPath: "", fuzzy: false },
      ],
    },
    customDictionary: {
      a: [
        { value: "a", type: "customDictionary", createdPath: "", fuzzy: false },
        { value: "a", type: "customDictionary", createdPath: "", fuzzy: false },
      ],
    },
    currentFile: {
      a: [
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
      ],
    },
    currentVault: {
      a: [
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
      ],
    },
  };

  test("word type priority order in front matter tags", () => {
    expect(
      suggestWords(indexedWords2, "a", 10, { frontMatter: "tags" }),
    ).toStrictEqual([
      {
        key: "tags",
        value: "a",
        hit: "a",
        type: "frontMatter",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("word type priority order not in front matter", () => {
    expect(suggestWords(indexedWords2, "a", 10)).toStrictEqual([
      {
        value: "a",
        hit: "a",
        type: "internalLink",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "a",
        hit: "a",
        type: "customDictionary",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("empty in front matter alias", () => {
    expect(
      suggestWords(indexedWords2, "a", 10, { frontMatter: "alias" }),
    ).toStrictEqual([]);
  });

  test("empty in front matter aliases", () => {
    expect(
      suggestWords(indexedWords2, "a", 10, { frontMatter: "aliases" }),
    ).toStrictEqual([]);
  });

  const indexedWords3: IndexedWords = {
    frontMatter: {},
    internalLink: {},
    customDictionary: {},
    currentFile: {
      a: [
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
      ],
    },
    currentVault: {
      a: [
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
      ],
    },
  };

  test("word type priority order (currentFile & currentVault)", () => {
    expect(suggestWords(indexedWords3, "a", 10)).toStrictEqual([
      {
        value: "a",
        hit: "a",
        type: "currentFile",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });
});

describe("suggestWordsByPartialMatch", () => {
  const createIndexedWords = (): IndexedWords => ({
    currentFile: {
      a: [
        { value: "ai", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "aiUEO", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "Arc", type: "currentFile", createdPath: "", fuzzy: false },
      ],
    },
    currentVault: {},
    customDictionary: {
      a: [
        {
          value: "uwaa",
          aliases: ["aaa"],
          type: "customDictionary",
          createdPath: "",
          fuzzy: false,
        },
        {
          value: "aiUEO",
          type: "customDictionary",
          createdPath: "",
          fuzzy: false,
        },
      ],
      A: [
        {
          value: "AWS",
          type: "customDictionary",
          createdPath: "",
          fuzzy: false,
        },
      ],
      u: [
        {
          value: "uwaa",
          aliases: ["aaa"],
          type: "customDictionary",
          createdPath: "",
          fuzzy: false,
        },
      ],
      U: [
        {
          value: "UFO",
          aliases: ["Unidentified flying object"],
          createdPath: "",
          fuzzy: false,
          type: "customDictionary",
        },
      ],
    },
    internalLink: {
      a: [
        { value: "aiUEO", type: "internalLink", createdPath: "", fuzzy: false },
        {
          value: "あいうえお",
          type: "internalLink",
          aliases: ["aiueo"],
          createdPath: "",
          fuzzy: false,
        },
      ],
      A: [
        { value: "AWS", type: "internalLink", createdPath: "", fuzzy: false },
        {
          value: "AI",
          type: "internalLink",
          createdPath: "a/AI.md",
          fuzzy: false,
        },
        {
          value: "AI",
          type: "internalLink",
          createdPath: "b/AI.md",
          fuzzy: false,
        },
      ],
      あ: [
        {
          value: "あいうえお",
          type: "internalLink",
          aliases: ["aiueo"],
          createdPath: "",
          fuzzy: false,
        },
      ],
    },
    frontMatter: {}, // TODO: Add value
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    // It is as specified that max doesn't match the expected length
    expect(suggestWordsByPartialMatch(indexedWords, "a", 12)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        type: "currentFile",
        hit: "ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "internalLink",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "customDictionary",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        type: "customDictionary",
        hit: "aaa",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Arc",
        type: "currentFile",
        hit: "Arc",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      // ??? currentFile
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "ai", 10)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        type: "currentFile",
        hit: "ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "aiu", 10)).toStrictEqual([
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: ueo (fuzzy: true)", () => {
    const indexedWords = createIndexedWords();
    expect(
      suggestWordsByPartialMatch(indexedWords, "ueo", 10, {
        fuzzy: { minMatchScore: 0 },
      }),
    ).toStrictEqual([
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        aliases: ["Unidentified flying object"],
        createdPath: "",
        fuzzy: true,
        hit: "Unidentified flying object",
        type: "customDictionary",
        value: "UFO",
      },
    ]);
  });

  test("Query: ueo (fuzzy: false)", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "ueo", 10)).toStrictEqual([
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    // It is as specified that max doesn't match the expected length
    expect(suggestWordsByPartialMatch(indexedWords, "A", 12)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        type: "currentFile",
        hit: "Ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "internalLink",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AWS",
        type: "customDictionary",
        hit: "AWS",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        type: "customDictionary",
        hit: "aaa",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Arc",
        type: "currentFile",
        hit: "Arc",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        type: "customDictionary",
        hit: "AiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "Ai", 10)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        type: "currentFile",
        hit: "Ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        type: "customDictionary",
        hit: "AiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AI", 10)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "Ai",
        type: "currentFile",
        hit: "Ai",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        type: "customDictionary",
        hit: "AiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AIU", 10)).toStrictEqual([
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "AiUEO",
        type: "customDictionary",
        hit: "AiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "u", 10)).toStrictEqual([
      {
        value: "UFO",
        type: "customDictionary",
        hit: "UFO",
        aliases: ["Unidentified flying object"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "uwaa",
        type: "customDictionary",
        hit: "uwaa",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "U", 10)).toStrictEqual([
      {
        value: "UFO",
        type: "customDictionary",
        hit: "UFO",
        aliases: ["Unidentified flying object"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "Uwaa",
        type: "customDictionary",
        hit: "Uwaa",
        aliases: ["aaa"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "internalLink",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "あいうえお",
        type: "internalLink",
        hit: "aiueo",
        aliases: ["aiueo"],
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "aiUEO",
        type: "customDictionary",
        hit: "aiUEO",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "a", 3)).toStrictEqual([
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "a/AI.md",
        fuzzy: false,
      },
      {
        value: "AI",
        type: "internalLink",
        hit: "AI",
        createdPath: "b/AI.md",
        fuzzy: false,
      },
      {
        value: "ai",
        type: "currentFile",
        hit: "ai",
        createdPath: "",
        fuzzy: false,
      },
      // { value: "AWS", type: "internalLink", hit: "AWS", createdPath: "", },
    ]);
  });

  const indexedWords2: IndexedWords = {
    frontMatter: {
      tags: {
        a: [
          {
            key: "tags",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "tags",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
      alias: {
        a: [
          {
            key: "alias",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "alias",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
      aliases: {
        a: [
          {
            key: "aliases",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
          {
            key: "aliases",
            value: "a",
            type: "frontMatter",
            createdPath: "",
            fuzzy: false,
          },
        ],
      },
    },
    internalLink: {
      a: [
        { value: "a", type: "internalLink", createdPath: "", fuzzy: false },
        { value: "a", type: "internalLink", createdPath: "", fuzzy: false },
      ],
    },
    customDictionary: {
      a: [
        { value: "a", type: "customDictionary", createdPath: "", fuzzy: false },
        { value: "a", type: "customDictionary", createdPath: "", fuzzy: false },
      ],
    },
    currentFile: {
      a: [
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
      ],
    },
    currentVault: {
      a: [
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
      ],
    },
  };

  test("word type priority order in front matter tags", () => {
    expect(
      suggestWordsByPartialMatch(indexedWords2, "a", 10, {
        frontMatter: "tags",
      }),
    ).toStrictEqual([
      {
        key: "tags",
        value: "a",
        type: "frontMatter",
        hit: "a",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("word type priority order not in front matter", () => {
    expect(suggestWordsByPartialMatch(indexedWords2, "a", 10)).toStrictEqual([
      {
        value: "a",
        type: "internalLink",
        hit: "a",
        createdPath: "",
        fuzzy: false,
      },
      {
        value: "a",
        type: "customDictionary",
        hit: "a",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });

  test("empty in front matter alias", () => {
    expect(
      suggestWordsByPartialMatch(indexedWords2, "a", 10, {
        frontMatter: "alias",
      }),
    ).toStrictEqual([]);
  });

  test("empty in front matter aliases", () => {
    expect(
      suggestWordsByPartialMatch(indexedWords2, "a", 10, {
        frontMatter: "alias",
      }),
    ).toStrictEqual([]);
  });

  const indexedWords3: IndexedWords = {
    frontMatter: {},
    internalLink: {},
    customDictionary: {},
    currentFile: {
      a: [
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
        { value: "a", type: "currentFile", createdPath: "", fuzzy: false },
      ],
    },
    currentVault: {
      a: [
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
        { value: "a", type: "currentVault", createdPath: "", fuzzy: false },
      ],
    },
  };

  test("word type priority order (currentFile & currentVault)", () => {
    expect(suggestWordsByPartialMatch(indexedWords3, "a", 10)).toStrictEqual([
      {
        value: "a",
        type: "currentFile",
        hit: "a",
        createdPath: "",
        fuzzy: false,
      },
    ]);
  });
});
