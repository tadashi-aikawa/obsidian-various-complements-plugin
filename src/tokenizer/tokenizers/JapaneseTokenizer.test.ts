import { createTokenizer } from "../tokenizer";
import { TokenizeStrategy } from "../TokenizeStrategy";

describe.each`
  content               | raw      | expected
  ${"aa bb cc"}         | ${false} | ${["aa", "bb", "cc"]}
  ${"イーディス旧市街"} | ${false} | ${["イーディス", "旧", "市街"]}
`("tokenize", ({ content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.JAPANESE).tokenize(content, raw)
    ).toStrictEqual(expected);
  });
});

describe.each`
  content                | expected
  ${"aa bb cc"}          | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}          | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"イーディス旧市街"}  | ${[{ word: "イーディス旧市街", offset: 0 }, { word: "旧市街", offset: 5 }, { word: "市街", offset: 6 }]}
  ${"イーディス 旧市街"} | ${[{ word: "イーディス 旧市街", offset: 0 }, { word: "旧市街", offset: 6 }, { word: "市街", offset: 7 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.JAPANESE).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
