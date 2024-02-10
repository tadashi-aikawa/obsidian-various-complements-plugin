import { describe, expect, test } from "@jest/globals";
import { JapaneseTokenizer } from "./JapaneseTokenizer";
import type { FactoryArgs } from "../tokenizer";

// treatUnderscoreAsPartOfWord: true はサポート外のため呼び出す想定にないのでテストしない
describe.each<{
  constructorArgs: FactoryArgs;
  content: string;
  raw: boolean;
  expected: string[];
}>`
  constructorArgs | content                      | raw      | expected
  ${{}}           | ${"aa bb cc"}                | ${false} | ${["aa", "bb", "cc"]}
  ${{}}           | ${"イーディス旧市街"}        | ${false} | ${["イーディス", "旧", "市街"]}
  ${{}}           | ${"$\\alpha"}                | ${false} | ${["$", "\\", "alpha"]}
  ${{}}           | ${"$var"}                    | ${false} | ${["$var"]}
  ${{}}           | ${"2022-10-02"}              | ${false} | ${["2022-10-02"]}
  ${{}}           | ${"TypeScript5.0.1リリース"} | ${false} | ${["TypeScript", "5.0.1", "リリース"]}
  ${{}}           | ${"**bold** *italic*"}       | ${false} | ${["bold", "italic"]}
  ${{}}           | ${"__a _b __c__ d_ e__"}     | ${false} | ${["a", "b", "c", "d", "e"]}
  ${{}}           | ${"let hoge_huga = 1"}       | ${false} | ${["let", "hoge", "huga", "1"]}
  ${{}}           | ${"2023-05-25"}              | ${false} | ${["2023-05-25"]}
  ${{}}           | ${"1.2.34"}                  | ${false} | ${["1.2.34"]}
  ${{}}           | ${"v1.2.34"}                 | ${false} | ${["v", "1.2.34"]}
  ${{}}           | ${"123\n456"}                | ${false} | ${["123", "456"]}
  ${{}}           | ${"- 123"}                   | ${false} | ${["-", "123"]}
`("tokenize", ({ constructorArgs, content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(
      new JapaneseTokenizer(constructorArgs).tokenize(content, raw)
    ).toStrictEqual(expected);
  });
});

// The expectation for `$\\alpha` is because of tiny-segmenter's specifications
describe.each<{
  constructorArgs: FactoryArgs;
  content: string;
  expected: { word: string; offset: number }[];
}>`
  constructorArgs | content                      | expected
  ${{}}           | ${"aa bb cc"}                | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${{}}           | ${"aa:bb:cc"}                | ${[{ word: "aa:bb:cc", offset: 0 }, { word: ":bb:cc", offset: 2 }, { word: "bb:cc", offset: 3 }, { word: ":cc", offset: 5 }, { word: "cc", offset: 6 }]}
  ${{}}           | ${"イーディス旧市街"}        | ${[{ word: "イーディス旧市街", offset: 0 }, { word: "旧市街", offset: 5 }, { word: "市街", offset: 6 }]}
  ${{}}           | ${"イーディス 旧市街"}       | ${[{ word: "イーディス 旧市街", offset: 0 }, { word: "旧市街", offset: 6 }, { word: "市街", offset: 7 }]}
  ${{}}           | ${"## @smi"}                 | ${[{ word: "## @smi", offset: 0 }, { word: "# @smi", offset: 1 }, { word: "@smi", offset: 3 }, { word: "smi", offset: 4 }]}
  ${{}}           | ${"$\\alpha"}                | ${[{ word: "$\\alpha", offset: 0 }, { word: "\\alpha", offset: 1 }, { word: "alpha", offset: 2 }]}
  ${{}}           | ${"::one::two"}              | ${[{ word: "::one::two", offset: 0 }, { word: ":one::two", offset: 1 }, { word: "one::two", offset: 2 }, { word: "::two", offset: 5 }, { word: ":two", offset: 6 }, { word: "two", offset: 7 }]}
  ${{}}           | ${"- :smile"}                | ${[{ word: "- :smile", offset: 0 }, { word: ":smile", offset: 2 }, { word: "smile", offset: 3 }]}
  ${{}}           | ${"2022-10-02"}              | ${[{ word: "2022-10-02", offset: 0 }]}
  ${{}}           | ${"TypeScript5.0.1リリース"} | ${[{ word: "TypeScript5.0.1リリース", offset: 0 }, { word: "5.0.1リリース", offset: 10 }, { word: "リリース", offset: 15 }]}
  ${{}}           | ${"__a _b __c__ d_ e__"}     | ${[{ word: "__a _b __c__ d_ e__", offset: 0 }, { word: "a _b __c__ d_ e__", offset: 2 }, { word: "_b __c__ d_ e__", offset: 4 }, { word: "b __c__ d_ e__", offset: 5 }, { word: "__c__ d_ e__", offset: 7 }, { word: "c__ d_ e__", offset: 9 }, { word: "__ d_ e__", offset: 10 }, { word: "d_ e__", offset: 13 }, { word: "_ e__", offset: 14 }, { word: "e__", offset: 16 }, { word: "__", offset: 17 }]}
`("recursiveTokenize", ({ constructorArgs, content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      new JapaneseTokenizer(constructorArgs).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
