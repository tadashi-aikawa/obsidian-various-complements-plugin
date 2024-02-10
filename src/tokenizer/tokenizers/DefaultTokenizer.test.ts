import { describe, expect, test } from "@jest/globals";
import { DefaultTokenizer } from "./DefaultTokenizer";
import type { FactoryArgs } from "../tokenizer";

describe.each<{
  constructorArgs: FactoryArgs;
  content: string;
  expected: { word: string; offset: number }[];
}>`
  constructorArgs                          | content                  | expected
  ${{}}                                    | ${"aa bb cc"}            | ${["aa", "bb", "cc"]}
  ${{}}                                    | ${"aa:bb:cc"}            | ${["aa", "bb", "cc"]}
  ${{}}                                    | ${"aa.bb.cc"}            | ${["aa.bb.cc"]}
  ${{}}                                    | ${"aa. bb. cc"}          | ${["aa", "bb", "cc"]}
  ${{}}                                    | ${"0.1.2"}               | ${["0.1.2"]}
  ${{}}                                    | ${"word."}               | ${["word"]}
  ${{}}                                    | ${"word.."}              | ${["word"]}
  ${{}}                                    | ${"## @smi"}             | ${["##", "@smi"]}
  ${{}}                                    | ${"$\\alpha"}            | ${["$\\alpha"]}
  ${{}}                                    | ${"::one::two"}          | ${["one", "two"]}
  ${{}}                                    | ${"**bold** *italic*"}   | ${["bold", "italic"]}
  ${{}}                                    | ${"__a _b __c__ d_ e__"} | ${["a", "b", "c", "d", "e"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"__a _b __c__ d_ e__"} | ${["__a", "_b", "__c__", "d_", "e__"]}
  ${{}}                                    | ${"let hoge_huga = 1"}   | ${["let", "hoge", "huga", "1"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"let hoge_huga = 1"}   | ${["let", "hoge_huga", "1"]}
  ${{}}                                    | ${'"aaa" "bbb"'}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"'aaa' 'bbb'"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"„aaa“ „bbb“"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‚aaa’ ‚bbb’"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"“aaa” “bbb”"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‘aaa’ ‘bbb’"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"„aaa” „bbb”"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‚aaa’ ‚bbb’"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"«aaa» «bbb»"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‹aaa› ‹bbb›"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"»aaa« »bbb«"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"›aaa‹ ›bbb‹"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"”aaa” ”bbb”"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"’aaa’ ’bbb’"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"»aaa» »bbb»"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"›aaa› ›bbb›"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"“aaa„ “bbb„"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‘aaa‚ ‘bbb‚"}         | ${["aaa", "bbb"]}
  ${{}}                                    | ${"‘aaa’ ‘bbb’"}         | ${["aaa", "bbb"]}
`("tokenize", ({ constructorArgs, content, expected }) => {
  test(`tokenize(${content}) = ${expected}`, () => {
    expect(
      new DefaultTokenizer(constructorArgs).tokenize(content)
    ).toStrictEqual(expected);
  });
});

// The expectation for "::one::two" is not ideal, probably.
// The expectation for "__a __c__ e__" is strange but compromised.
describe.each<{
  constructorArgs: FactoryArgs;
  content: string;
  expected: { word: string; offset: number }[];
}>`
  constructorArgs                          | content            | expected
  ${{}}                                    | ${"aa bb cc"}      | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${{}}                                    | ${"aa:bb:cc"}      | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${{}}                                    | ${"## @smi"}       | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }]}
  ${{}}                                    | ${"$\\alpha"}      | ${[{ word: "$\\alpha", offset: 0 }, { word: "\\alpha", offset: 1 }]}
  ${{}}                                    | ${"::one::two"}    | ${[{ word: "::one::two", offset: 0 }, { word: ":one::two", offset: 1 }, { word: "one::two", offset: 2 }, { word: ":two", offset: 6 }, { word: "two", offset: 7 }]}
  ${{}}                                    | ${"__a __c__ e__"} | ${[{ word: "__a __c__ e__", offset: 0 }, { word: "_a __c__ e__", offset: 1 }, { word: "a __c__ e__", offset: 2 }, { word: "__c__ e__", offset: 4 }, { word: "_c__ e__", offset: 5 }, { word: "c__ e__", offset: 6 }, { word: "_ e__", offset: 8 }, { word: " e__", offset: 9 }, { word: "e__", offset: 10 }, { word: "_", offset: 12 }, { word: "", offset: 13 }]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"__a __c__ e__"} | ${[{ word: "__a __c__ e__", offset: 0 }, { word: "__c__ e__", offset: 4 }, { word: "e__", offset: 10 }]}
`("recursiveTokenize", ({ constructorArgs, content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(
      new DefaultTokenizer(constructorArgs).recursiveTokenize(content)
    ).toStrictEqual(expected);
  });
});
