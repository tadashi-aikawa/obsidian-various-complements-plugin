import { createTokenizer } from "../tokenizer";
import { TokenizeStrategy } from "../TokenizeStrategy";

describe.each`
  content                 | raw      | expected
  ${"aa bb cc"}           | ${false} | ${["aa", "bb", "cc"]}
  ${"Edith旧市街"}        | ${false} | ${["Edith", "旧市街"]}
  ${"Edith旧city"}        | ${false} | ${["Edith", "旧", "city"]}
  ${"イーディスold city"} | ${false} | ${["イーディス", "old", "city"]}
  ${"イーディスold市街"}  | ${false} | ${["イーディス", "old", "市街"]}
  ${"イーディス旧市街"}   | ${false} | ${["イーディス旧市街"]}
`("tokenize", ({ content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.ENGLISH_ONLY).tokenize(content, raw)
    ).toStrictEqual(expected);
  });
});

describe.each`
  content           | expected
  ${"aa bb cc"}     | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}     | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"## @smi"}      | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }, { word: "smi", offset: 4 }]}
  ${"Edith旧市街"}  | ${[{ word: "Edith旧市街", offset: 0 }, { word: "旧市街", offset: 5 }]}
  ${"Edith旧city"}  | ${[{ word: "Edith旧city", offset: 0 }, { word: "旧city", offset: 5 }, { word: "city", offset: 6 }]}
  ${"ヒナold city"} | ${[{ word: "ヒナold city", offset: 0 }, { word: "old city", offset: 2 }, { word: "city", offset: 6 }]}
  ${"ヒナold市街"}  | ${[{ word: "ヒナold市街", offset: 0 }, { word: "old市街", offset: 2 }, { word: "市街", offset: 5 }]}
  ${"ヒナ旧市街"}   | ${[{ word: "ヒナ旧市街", offset: 0 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.ENGLISH_ONLY).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
