import { describe, expect, test } from "@jest/globals";
import { JapaneseTokenizer } from "./JapaneseTokenizer";

describe.each<{ content: string; raw: boolean; expected: string[] }>`
  content               | raw      | expected
  ${"aa bb cc"}         | ${false} | ${["aa", "bb", "cc"]}
  ${"イーディス旧市街"} | ${false} | ${["イーディス", "旧", "市街"]}
  ${"$\\alpha"}         | ${false} | ${["\\alpha"]}
`("tokenize", ({ content, raw, expected }) => {
  test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
    expect(new JapaneseTokenizer().tokenize(content, raw)).toStrictEqual(
      expected
    );
  });
});

// The expectation for `$\\alpha` is because of tiny-segmenter's specifications
describe.each<{
  content: string;
  expected: { word: string; offset: number }[];
}>`
  content                | expected
  ${"aa bb cc"}          | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}          | ${[{ word: "aa:bb:cc", offset: 0 }, { word: ":bb:cc", offset: 2 }, { word: "bb:cc", offset: 3 }, { word: ":cc", offset: 5 }, { word: "cc", offset: 6 }]}
  ${"イーディス旧市街"}  | ${[{ word: "イーディス旧市街", offset: 0 }, { word: "旧市街", offset: 5 }, { word: "市街", offset: 6 }]}
  ${"イーディス 旧市街"} | ${[{ word: "イーディス 旧市街", offset: 0 }, { word: "旧市街", offset: 6 }, { word: "市街", offset: 7 }]}
  ${"## @smi"}           | ${[{ word: "## @smi", offset: 0 }, { word: "# @smi", offset: 1 }, { word: "@smi", offset: 3 }, { word: "smi", offset: 4 }]}
  ${"$\\alpha"}          | ${[{ word: "$\\alpha", offset: 0 }, { word: "\\alpha", offset: 1 }, { word: "alpha", offset: 2 }]}
  ${"::one::two"}        | ${[{ word: "::one::two", offset: 0 }, { word: ":one::two", offset: 1 }, { word: "one::two", offset: 2 }, { word: "::two", offset: 5 }, { word: ":two", offset: 6 }, { word: "two", offset: 7 }]}
  ${"- :smile"}          | ${[{ word: "- :smile", offset: 0 }, { word: ":smile", offset: 2 }, { word: "smile", offset: 3 }]}
`("recursiveTokenize", ({ content, expected }) => {
  test(`recursiveTokenize(${content}) = ${expected}`, () => {
    expect(new JapaneseTokenizer().recursiveTokenize(content)).toStrictEqual(
      expected
    );
  });
});
