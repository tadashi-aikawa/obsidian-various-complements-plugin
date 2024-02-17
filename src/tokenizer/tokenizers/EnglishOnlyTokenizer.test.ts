import { describe, expect, test } from "@jest/globals";
import { EnglishOnlyTokenizer } from "./EnglishOnlyTokenizer";
import type { FactoryArgs } from "../tokenizer";

describe.each<{
  constructorArgs: FactoryArgs;
  content: string;
  raw: boolean;
  expected: string[];
}>`
  constructorArgs                          | content                  | raw      | expected
  ${{}}                                    | ${"aa bb cc"}            | ${false} | ${["aa", "bb", "cc"]}
  ${{}}                                    | ${"Edith旧市街"}         | ${false} | ${["Edith"]}
  ${{}}                                    | ${"Edith旧city"}         | ${false} | ${["Edith", "city"]}
  ${{}}                                    | ${"イーディスold city"}  | ${false} | ${["old", "city"]}
  ${{}}                                    | ${"イーディスold市街"}   | ${false} | ${["old"]}
  ${{}}                                    | ${"イーディス旧市街"}    | ${false} | ${[]}
  ${{}}                                    | ${"$\\alpha"}            | ${false} | ${["\\alpha"]}
  ${{}}                                    | ${"__a _b __c__ d_ e__"} | ${false} | ${["a", "b", "c", "d", "e"]}
  ${{}}                                    | ${"let hoge_huga = 1"}   | ${false} | ${["let", "hoge", "huga", "1"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"__a _b __c__ d_ e__"} | ${false} | ${["__a", "_b", "__c__", "d_", "e__"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"let hoge_huga = 1"}   | ${false} | ${["let", "hoge_huga", "1"]}
  ${{}}                                    | ${"aaa\nbbb"}            | ${false} | ${["aaa", "bbb"]}
  ${{}}                                    | ${"aaa\r\nbbb"}          | ${false} | ${["aaa", "bbb"]}
`("tokenize", ({ constructorArgs, content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(
      new EnglishOnlyTokenizer(constructorArgs).tokenize(content, raw)
    ).toStrictEqual(expected);
  });
});

describe.each<{
  content: string;
  expected: { word: string; offset: number }[];
}>`
  content           | expected
  ${"aa bb cc"}     | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}     | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"## @smi"}      | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }, { word: "smi", offset: 4 }]}
  ${"@smi"}         | ${[{ word: "@smi", offset: 0 }, { word: "smi", offset: 1 }]}
  ${"Edith旧市街"}  | ${[{ word: "Edith旧市街", offset: 0 }, { word: "旧市街", offset: 5 }]}
  ${"Edith旧city"}  | ${[{ word: "Edith旧city", offset: 0 }, { word: "旧city", offset: 5 }, { word: "city", offset: 6 }]}
  ${"ヒナold city"} | ${[{ word: "ヒナold city", offset: 0 }, { word: "old city", offset: 2 }, { word: "city", offset: 6 }]}
  ${"ヒナold市街"}  | ${[{ word: "ヒナold市街", offset: 0 }, { word: "old市街", offset: 2 }, { word: "市街", offset: 5 }]}
  ${"ヒナ旧市街"}   | ${[{ word: "ヒナ旧市街", offset: 0 }]}
  ${"$\\alpha"}     | ${[{ word: "$\\alpha", offset: 0 }, { word: "\\alpha", offset: 1 }]}
  ${"::one::two"}   | ${[{ word: "::one::two", offset: 0 }, { word: "one::two", offset: 2 }, { word: "two", offset: 7 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(new EnglishOnlyTokenizer().recursiveTokenize(content)).toStrictEqual(
      expected
    );
  });
});
