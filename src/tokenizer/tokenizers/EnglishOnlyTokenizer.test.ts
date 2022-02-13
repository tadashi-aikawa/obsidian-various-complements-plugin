import { createTokenizer } from "../tokenizer";
import { TokenizeStrategy } from "../TokenizeStrategy";

describe.each`
  content                 | raw      | expected
  ${"aa bb cc"}           | ${false} | ${["aa", "bb", "cc"]}
  ${"Edith旧市街"}        | ${false} | ${["Edith"]}
  ${"Edith旧city"}        | ${false} | ${["Edith", "city"]}
  ${"イーディスold city"} | ${false} | ${["old", "city"]}
  ${"イーディスold市街"}  | ${false} | ${["old"]}
  ${"イーディス旧市街"}   | ${false} | ${[]}
`("tokenize", ({ content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.ENGLISH_ONLY).tokenize(content, raw)
    ).toStrictEqual(expected);
  });
});

// XXX: Hack implementation. There are some problems especially in recursiveTokenize.
describe.each`
  content           | expected
  ${"aa bb cc"}     | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}     | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"## @smi"}      | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }]}
  ${"Edith旧市街"}  | ${[{ word: "Edith旧市街", offset: 0 }, { word: "市街", offset: 6 }, { word: "街", offset: 7 }, { word: "", offset: 8 }]}
  ${"Edith旧city"}  | ${[{ word: "Edith旧city", offset: 0 }, { word: "city", offset: 6 }]}
  ${"ヒナold city"} | ${[{ word: "ヒナold city", offset: 0 }, { word: "ナold city", offset: 1 }, { word: "old city", offset: 2 }, { word: "city", offset: 6 }]}
  ${"ヒナold市街"}  | ${[{ word: "ヒナold市街", offset: 0 }, { word: "ナold市街", offset: 1 }, { word: "old市街", offset: 2 }, { word: "街", offset: 6 }, { word: "", offset: 7 }]}
  ${"ヒナ旧市街"}   | ${[{ word: "ヒナ旧市街", offset: 0 }, { word: "ナ旧市街", offset: 1 }, { word: "旧市街", offset: 2 }, { word: "市街", offset: 3 }, { word: "街", offset: 4 }, { word: "", offset: 5 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.ENGLISH_ONLY).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
