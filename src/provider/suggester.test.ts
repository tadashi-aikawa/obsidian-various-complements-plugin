import {
  judge,
  judgeByPartialMatch,
  pushWord,
  suggestWords,
  suggestWordsByPartialMatch,
  WordsByFirstLetter,
} from "./suggester";
import { describe, expect } from "@jest/globals";
import { IndexedWords } from "../ui/AutoCompleteSuggest";

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
        { value: "aaa", type: "currentFile" },
        { value: "aa", type: "currentFile" },
      ],
      u: [{ value: "uuu", type: "currentFile" }],
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
        { value: "aaa", type: "currentFile" },
        { value: "aa", type: "currentFile" },
        { value: "a", type: "currentFile" },
      ],
    });
  });
});

describe.each`
  word                                                                   | query   | queryStartWithUpper | expected
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ab"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bc"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", aliases: ["ab"], type: "customDictionary" }}       | ${"ab"} | ${false}            | ${{ word: { value: "abcde", aliases: ["ab"], type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"ab"} | ${false}            | ${{ word: { value: "abcde", type: "internalLink" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Ab"} | ${true}             | ${{ word: { value: "Abcde", type: "customDictionary" }, value: "Abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bc"} | ${true}             | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"Ab"} | ${false}            | ${{ word: { value: "abcde", type: "internalLink" }, value: "abcde", alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Ab"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, value: "abc", alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bc"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ce"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
`("judge", ({ word, query, queryStartWithUpper, expected }) => {
  test(`judge(${JSON.stringify(
    word
  )}, ${query}, ${queryStartWithUpper}) = ${JSON.stringify(expected)}`, () => {
    expect(judge(word, query, queryStartWithUpper)).toStrictEqual(expected);
  });
});

describe.each`
  word                                                                   | query   | queryStartWithUpper | expected
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ab"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"bc"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", aliases: ["ab"], type: "customDictionary" }}       | ${"ab"} | ${false}            | ${{ word: { value: "abcde", aliases: ["ab"], type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"ab"} | ${false}            | ${{ word: { value: "abcde", type: "internalLink" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Ab"} | ${true}             | ${{ word: { value: "Abcde", type: "customDictionary" }, value: "Abcde", alias: false }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"Bc"} | ${true}             | ${{ word: { value: "abcde", type: "customDictionary" }, value: "abcde", alias: false }}
  ${{ value: "abcde", type: "internalLink" }}                            | ${"Ab"} | ${false}            | ${{ word: { value: "abcde", type: "internalLink" }, value: "abcde", alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Ab"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, value: "abc", alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }} | ${"Bc"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"], type: "customDictionary" }, value: "abc", alias: true }}
  ${{ value: "abcde", type: "customDictionary" }}                        | ${"ce"} | ${false}            | ${{ word: { value: "abcde", type: "customDictionary" }, alias: false }}
`("judgeByPartialMatch", ({ word, query, queryStartWithUpper, expected }) => {
  test(`judgeByPartialMatch(${JSON.stringify(
    word
  )}, ${query}, ${queryStartWithUpper}) = ${JSON.stringify(expected)}`, () => {
    expect(judgeByPartialMatch(word, query, queryStartWithUpper)).toStrictEqual(
      expected
    );
  });
});

describe("suggestWords", () => {
  const createIndexedWords = (): IndexedWords => ({
    currentFile: {
      a: [
        { value: "ai", type: "currentFile", createdPath: "" },
        { value: "aiUEO", type: "currentFile", createdPath: "" },
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
        { value: "AI", type: "internalLink", createdPath: "" },
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
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
      {
        value: "uwaa",
        aliases: ["aaa"],

        type: "customDictionary",
      },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        aliases: ["aiueo"],

        type: "internalLink",
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "ai", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        aliases: ["aiueo"],

        type: "internalLink",
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "aiu", 10)).toStrictEqual([
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        aliases: ["aiueo"],

        type: "internalLink",
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "A", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
      { value: "AWS", type: "customDictionary" },
      {
        value: "uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
      },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "Ai", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AI", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AIU", 10)).toStrictEqual([
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "u", 10)).toStrictEqual([
      { value: "uwaa", type: "customDictionary", aliases: ["aaa"] },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "U", 10)).toStrictEqual([
      {
        value: "UFO",
        type: "customDictionary",
        aliases: ["Unidentified flying object"],
      },
      { value: "Uwaa", type: "customDictionary", aliases: ["aaa"] },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 3)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
      // --- hidden ---
      // { value: "uwaa", type: "customDictionary", aliases: ["aaa"] },
      // { value: "aiUEO", type: "internalLink" },
      // { value: "あいうえお", type: "internalLink", aliases: ["aiueo"] },
      // { value: "aiUEO", type: "customDictionary" },
      // { value: "aiUEO", type: "currentFile" },
    ]);
  });
});

describe("suggestWordsByPartialMatch", () => {
  const createIndexedWords = (): IndexedWords => ({
    currentFile: {
      a: [
        { value: "ai", type: "currentFile", createdPath: "" },
        { value: "aiUEO", type: "currentFile", createdPath: "" },
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
        { value: "AI", type: "internalLink", createdPath: "" },
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
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "a", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
      { value: "AWS", type: "customDictionary" },
      {
        value: "uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
      },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "aiUEO", type: "customDictionary" },
      // ??? currentFile
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "ai", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "aiu", 10)).toStrictEqual([
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "A", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
      { value: "AWS", type: "customDictionary" },
      {
        value: "uwaa",
        type: "customDictionary",
        aliases: ["aaa"],
      },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      // ??? currentFile
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "Ai", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AI", 10)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "Ai", type: "currentFile" },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AIU", 10)).toStrictEqual([
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "AiUEO", type: "customDictionary" },
      { value: "AiUEO", type: "currentFile" },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "u", 10)).toStrictEqual([
      {
        value: "UFO",
        type: "customDictionary",
        aliases: ["Unidentified flying object"],
      },
      { value: "uwaa", type: "customDictionary", aliases: ["aaa"] },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "U", 10)).toStrictEqual([
      {
        value: "UFO",
        type: "customDictionary",
        aliases: ["Unidentified flying object"],
      },
      { value: "Uwaa", type: "customDictionary", aliases: ["aaa"] },
      { value: "aiUEO", type: "internalLink" },
      {
        value: "あいうえお",
        type: "internalLink",
        aliases: ["aiueo"],
      },
      { value: "aiUEO", type: "customDictionary" },
      { value: "aiUEO", type: "currentFile" },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "a", 3)).toStrictEqual([
      { value: "AI", type: "internalLink" },
      { value: "ai", type: "currentFile" },
      { value: "AWS", type: "internalLink" },
    ]);
  });
});
