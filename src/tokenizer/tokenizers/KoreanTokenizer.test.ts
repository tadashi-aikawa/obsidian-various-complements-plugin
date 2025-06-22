import { describe, expect, test } from "@jest/globals";
import { KoreanTokenizer } from "./KoreanTokenizer";
import type { FactoryArgs } from "../tokenizer";

describe.each<{
    constructorArgs: FactoryArgs;
    content: string;
    raw: boolean;
    expected: string[];
}>`
  constructorArgs                          | content                       | raw      | expected
  ${{}}                                    | ${"aa bb cc"}                 | ${false} | ${["aa", "bb", "cc"]}
  ${{}}                                    | ${"Edith旧市街"}              | ${false} | ${["Edith", "旧市街"]}
  ${{}}                                    | ${"Edith旧city"}              | ${false} | ${["Edith", "旧", "city"]}
  ${{}}                                    | ${"イーディスold city"}       | ${false} | ${["old", "city"]}
  ${{}}                                    | ${"イーディスold市街"}        | ${false} | ${["old", "市街"]}
  ${{}}                                    | ${"イーディス旧市街"}         | ${false} | ${["旧市街"]}
  ${{}}                                    | ${"$\\alpha"}                 | ${false} | ${["\\alpha"]}
  ${{}}                                    | ${"__a _b __c__ d_ e__"}      | ${false} | ${["a", "b", "c", "d", "e"]}
  ${{}}                                    | ${"let hoge_huga = 1"}        | ${false} | ${["let", "hoge", "huga", "1"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"__a _b __c__ d_ e__"}      | ${false} | ${["__a", "_b", "__c__", "d_", "e__"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"let hoge_huga = 1"}        | ${false} | ${["let", "hoge_huga", "1"]}
  ${{}}                                    | ${"aaa\nbbb"}                 | ${false} | ${["aaa", "bbb"]}
  ${{}}                                    | ${"aaa\r\nbbb"}               | ${false} | ${["aaa", "bbb"]}
  ${{}}                                    | ${"한국어 테스트"}            | ${false} | ${["한국어", "테스트"]}
  ${{}}                                    | ${"한국어\n테스트"}           | ${false} | ${["한국어", "테스트"]}
  ${{}}                                    | ${"한국어\r\n테스트"}         | ${false} | ${["한국어", "테스트"]}
  ${{}}                                    | ${"__한 _국 __어__ 테_ 스__"} | ${false} | ${["한", "국", "어", "테", "스"]}
  ${{}}                                    | ${"let 한국어_테스트 = 1"}    | ${false} | ${["let", "한국어", "테스트", "1"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"__한 _국 __어__ 테_ 스__"} | ${false} | ${["__한", "_국", "__어__", "테_", "스__"]}
  ${{ treatUnderscoreAsPartOfWord: true }} | ${"let 한국어_테스트 = 1"}    | ${false} | ${["let", "한국어_테스트", "1"]}
  ${{}}                                    | ${"사과(apple)는 과일이다"}   | ${false} | ${["사과", "apple", "는", "과일이다"]}
  ${{}}                                    | ${"사과(沙果)는 과일이다"}    | ${false} | ${["사과", "沙果", "는", "과일이다"]}
  ${{}}                                    | ${"(과일)는 과일이다"}        | ${false} | ${["과일", "는", "과일이다"]}
  ${{}}                                    | ${"사과는 (과일) 과일이다"}   | ${false} | ${["사과는", "과일", "과일이다"]}
  ${{}}                                    | ${"사과'과일'는 과일이다"}    | ${false} | ${["사과", "과일", "는", "과일이다"]}
  ${{}}                                    | ${"'사과'는 과일이다"}        | ${false} | ${["사과", "는", "과일이다"]}
  ${{}}                                    | ${"사과는 '과일' 과일이다"}   | ${false} | ${["사과는", "과일", "과일이다"]}
`("tokenize", ({ constructorArgs, content, raw, expected }) => {
    test(`tokenize(${content}, ${raw}) = ${expected}`, () => {
        expect(
            new KoreanTokenizer(constructorArgs).tokenize(content, raw),
        ).toStrictEqual(expected);
    });
});

describe.each<{
    content: string;
    expected: { word: string; offset: number }[];
}>`
  content                      | expected
  ${"aa bb cc"}                | ${[{ word: "aa bb cc", offset: 0 }, { word: "bb cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"aa:bb:cc"}                | ${[{ word: "aa:bb:cc", offset: 0 }, { word: "bb:cc", offset: 3 }, { word: "cc", offset: 6 }]}
  ${"## @smi"}                 | ${[{ word: "## @smi", offset: 0 }, { word: "@smi", offset: 3 }, { word: "smi", offset: 4 }]}
  ${"@smi"}                    | ${[{ word: "@smi", offset: 0 }, { word: "smi", offset: 1 }]}
  ${"서울도시 Seoul city"}     | ${[{ word: "서울도시 Seoul city", offset: 0 }, { word: "Seoul city", offset: 5 }, { word: "city", offset: 11 }]}
  ${"Edith旧市街"}             | ${[{ word: "Edith旧市街", offset: 0 }, { word: "旧市街", offset: 5 }]}
  ${"Edith旧city"}             | ${[{ word: "Edith旧city", offset: 0 }, { word: "旧city", offset: 5 }, { word: "city", offset: 6 }]}
  ${"ヒナold city"}            | ${[{ word: "ヒナold city", offset: 0 }, { word: "old city", offset: 2 }, { word: "city", offset: 6 }]}
  ${"ヒナold市街"}             | ${[{ word: "ヒナold市街", offset: 0 }, { word: "old市街", offset: 2 }, { word: "市街", offset: 5 }]}
  ${"ヒナ旧市街"}              | ${[{ word: "ヒナ旧市街", offset: 0 }, { word: "旧市街", offset: 2 }]}
  ${"$\\alpha"}                | ${[{ word: "$\\alpha", offset: 0 }, { word: "\\alpha", offset: 1 }]}
  ${"::하나::둘"}              | ${[{ word: "::하나::둘", offset: 0 }, { word: "하나::둘", offset: 2 }, { word: "둘", offset: 6 }]}
  ${"사과(과일)는 과일이다"}   | ${[{ word: "사과(과일)는 과일이다", offset: 0 }, { word: "과일)는 과일이다", offset: 3 }, { word: "는 과일이다", offset: 6 }, { word: "과일이다", offset: 8 }]}
  ${"사과는 (과일) 과일이다"}  | ${[{ word: "사과는 (과일) 과일이다", offset: 0 }, { word: "과일) 과일이다", offset: 5 }, { word: "과일이다", offset: 9 }]}
  ${"app (fruit) isfruit"}     | ${[{ word: "app (fruit) isfruit", offset: 0 }, { word: "fruit) isfruit", offset: 5 }, { word: "isfruit", offset: 12 }]}
  ${"사과(apple)는 과일이다"}  | ${[{ word: "사과(apple)는 과일이다", offset: 0 }, { word: "apple)는 과일이다", offset: 3 }, { word: "는 과일이다", offset: 9 }, { word: "과일이다", offset: 11 }]}
  ${"사과(沙果)는 과일이다"}   | ${[{ word: "사과(沙果)는 과일이다", offset: 0 }, { word: "沙果)는 과일이다", offset: 3 }, { word: "는 과일이다", offset: 6 }, { word: "과일이다", offset: 8 }]}
  ${"(과일)는 과일이다"}       | ${[{ word: "(과일)는 과일이다", offset: 0 }, { word: "과일)는 과일이다", offset: 1 }, { word: "는 과일이다", offset: 4 }, { word: "과일이다", offset: 6 }]}
  ${"사과는 (과일) 과일이다"}  | ${[{ word: "사과는 (과일) 과일이다", offset: 0 }, { word: "과일) 과일이다", offset: 5 }, { word: "과일이다", offset: 9 }]}
  ${"사과'과일'는 과일이다"}   | ${[{ word: "사과'과일'는 과일이다", offset: 0 }, { word: "과일'는 과일이다", offset: 3 }, { word: "는 과일이다", offset: 6 }, { word: "과일이다", offset: 8 }]}
  ${"'사과'는 과일이다"}       | ${[{ word: "'사과'는 과일이다", offset: 0 }, { word: "사과'는 과일이다", offset: 1 }, { word: "는 과일이다", offset: 4 }, { word: "과일이다", offset: 6 }]}
  ${"사과는 '과일' 과일이다"}  | ${[{ word: "사과는 '과일' 과일이다", offset: 0 }, { word: "과일' 과일이다", offset: 5 }, { word: "과일이다", offset: 9 }]}
`("recursiveTokenize", ({ content, expected }) => {
    test(`recursiveTokenize(${content}) = ${expected}`, () => {
        expect(new KoreanTokenizer().recursiveTokenize(content)).toStrictEqual(
            expected,
        );
    });
});
