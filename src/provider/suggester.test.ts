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
    a: [{ value: "aaa" }, { value: "aa" }],
  });

  test("add", () => {
    const wordsByFirstLetter = createWordsByFirstLetter();
    pushWord(wordsByFirstLetter, "u", { value: "uuu" });
    expect(wordsByFirstLetter).toStrictEqual({
      a: [{ value: "aaa" }, { value: "aa" }],
      u: [{ value: "uuu" }],
    });
  });

  test("push", () => {
    const wordsByFirstLetter = createWordsByFirstLetter();
    pushWord(wordsByFirstLetter, "a", { value: "a" });
    expect(wordsByFirstLetter).toStrictEqual({
      a: [{ value: "aaa" }, { value: "aa" }, { value: "a" }],
    });
  });
});

describe.each`
  word                                         | query   | queryStartWithUpper | expected
  ${{ value: "abcde" }}                        | ${"ab"} | ${false}            | ${{ word: { value: "abcde" }, value: "abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"bc"} | ${false}            | ${{ word: { value: "abcde" }, alias: false }}
  ${{ value: "abcde", aliases: ["ab"] }}       | ${"ab"} | ${false}            | ${{ word: { value: "abcde", aliases: ["ab"] }, value: "abcde", alias: false }}
  ${{ value: "abcde", internalLink: true }}    | ${"ab"} | ${false}            | ${{ word: { value: "abcde", internalLink: true }, value: "abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"Ab"} | ${true}             | ${{ word: { value: "Abcde" }, value: "Abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"Bc"} | ${true}             | ${{ word: { value: "abcde" }, alias: false }}
  ${{ value: "abcde", internalLink: true }}    | ${"Ab"} | ${false}            | ${{ word: { value: "abcde", internalLink: true }, value: "abcde", alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"] }} | ${"Ab"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"] }, value: "abc", alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"] }} | ${"Bc"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"] }, alias: false }}
  ${{ value: "abcde" }}                        | ${"ce"} | ${false}            | ${{ word: { value: "abcde" }, alias: false }}
`("judge", ({ word, query, queryStartWithUpper, expected }) => {
  test(`judge(${JSON.stringify(
    word
  )}, ${query}, ${queryStartWithUpper}) = ${JSON.stringify(expected)}`, () => {
    expect(judge(word, query, queryStartWithUpper)).toStrictEqual(expected);
  });
});

describe.each`
  word                                         | query   | queryStartWithUpper | expected
  ${{ value: "abcde" }}                        | ${"ab"} | ${false}            | ${{ word: { value: "abcde" }, value: "abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"bc"} | ${false}            | ${{ word: { value: "abcde" }, value: "abcde", alias: false }}
  ${{ value: "abcde", aliases: ["ab"] }}       | ${"ab"} | ${false}            | ${{ word: { value: "abcde", aliases: ["ab"] }, value: "abcde", alias: false }}
  ${{ value: "abcde", internalLink: true }}    | ${"ab"} | ${false}            | ${{ word: { value: "abcde", internalLink: true }, value: "abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"Ab"} | ${true}             | ${{ word: { value: "Abcde" }, value: "Abcde", alias: false }}
  ${{ value: "abcde" }}                        | ${"Bc"} | ${true}             | ${{ word: { value: "abcde" }, value: "abcde", alias: false }}
  ${{ value: "abcde", internalLink: true }}    | ${"Ab"} | ${false}            | ${{ word: { value: "abcde", internalLink: true }, value: "abcde", alias: false }}
  ${{ value: "ce", aliases: ["abc", "abab"] }} | ${"Ab"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"] }, value: "abc", alias: true }}
  ${{ value: "ce", aliases: ["abc", "abab"] }} | ${"Bc"} | ${true}             | ${{ word: { value: "ce", aliases: ["abc", "abab"] }, value: "abc", alias: true }}
  ${{ value: "abcde" }}                        | ${"ce"} | ${false}            | ${{ word: { value: "abcde" }, alias: false }}
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
      a: [{ value: "ai" }, { value: "aiUEO" }],
    },
    customDictionary: {
      a: [{ value: "uwaa", aliases: ["aaa"] }, { value: "aiUEO" }],
      A: [{ value: "AWS" }],
      u: [{ value: "uwaa", aliases: ["aaa"] }],
      U: [{ value: "UFO", aliases: ["Unidentified flying object"] }],
    },
    internalLink: {
      a: [
        { value: "aiUEO", internalLink: true },
        { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      ],
      A: [
        { value: "AWS", internalLink: true },
        { value: "AI", internalLink: true },
      ],
      あ: [{ value: "あいうえお", internalLink: true, aliases: ["aiueo"] }],
    },
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "AWS", internalLink: true },
      { value: "uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "ai", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "aiu", 10)).toStrictEqual([
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "A", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "AWS", internalLink: true },
      { value: "AWS" },
      { value: "uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "Ai", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AI", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "AIU", 10)).toStrictEqual([
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "u", 10)).toStrictEqual([
      { value: "uwaa", aliases: ["aaa"] },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "U", 10)).toStrictEqual([
      { value: "UFO", aliases: ["Unidentified flying object"] },
      { value: "Uwaa", aliases: ["aaa"] },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWords(indexedWords, "a", 3)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "AWS", internalLink: true },
      // --- hidden ---
      // { value: "uwaa", aliases: ["aaa"] },
      // { value: "aiUEO", internalLink: true },
      // { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      // { value: "aiUEO" },
    ]);
  });
});

describe("suggestWordsByPartialMatch", () => {
  const createIndexedWords = (): IndexedWords => ({
    currentFile: {
      a: [{ value: "ai" }, { value: "aiUEO" }],
    },
    customDictionary: {
      a: [{ value: "uwaa", aliases: ["aaa"] }, { value: "aiUEO" }],
      A: [{ value: "AWS" }],
      u: [{ value: "uwaa", aliases: ["aaa"] }],
      U: [{ value: "UFO", aliases: ["Unidentified flying object"] }],
    },
    internalLink: {
      a: [
        { value: "aiUEO", internalLink: true },
        { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      ],
      A: [
        { value: "AWS", internalLink: true },
        { value: "AI", internalLink: true },
      ],
      あ: [{ value: "あいうえお", internalLink: true, aliases: ["aiueo"] }],
    },
  });

  test("Query: a", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "a", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "AWS", internalLink: true },
      { value: "AWS" },
      { value: "uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "ai", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: aiu", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "aiu", 10)).toStrictEqual([
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: A", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "A", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "AWS", internalLink: true },
      { value: "AWS" },
      { value: "uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: Ai", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "Ai", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: AI", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AI", 10)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "Ai" },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: AIU", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "AIU", 10)).toStrictEqual([
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "AiUEO" },
    ]);
  });

  test("Query: u", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "u", 10)).toStrictEqual([
      { value: "UFO", aliases: ["Unidentified flying object"] },
      { value: "uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("Query: U", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "U", 10)).toStrictEqual([
      { value: "UFO", aliases: ["Unidentified flying object"] },
      { value: "Uwaa", aliases: ["aaa"] },
      { value: "aiUEO", internalLink: true },
      { value: "あいうえお", internalLink: true, aliases: ["aiueo"] },
      { value: "aiUEO" },
    ]);
  });

  test("max: 3", () => {
    const indexedWords = createIndexedWords();
    expect(suggestWordsByPartialMatch(indexedWords, "a", 3)).toStrictEqual([
      { value: "AI", internalLink: true },
      { value: "ai" },
      { value: "AWS", internalLink: true },
    ]);
  });
});
