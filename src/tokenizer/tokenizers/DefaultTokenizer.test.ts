import { createTokenizer } from "../tokenizer";
import { TokenizeStrategy } from "../TokenizeStrategy";

describe.each`
  content       | expected
  ${"aa bb cc"} | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"} | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"## @smi"}  | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      createTokenizer(TokenizeStrategy.DEFAULT).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
