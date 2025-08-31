import { describe, expect, test } from "@jest/globals";
import {
  allAlphabets,
  allNumbersOrFewSymbols,
  capitalizeFirstLetter,
  encodeSpace,
  equalsAsLiterals,
  excludeEmoji,
  excludeSpace,
  findCommonPrefix,
  type FuzzyResult,
  // Avoid https://github.com/aelbore/esbuild-jest/issues/57
  isEOTinCodeBlock as isEOTinCodeBlock_,
  isInternalLink,
  joinNumberWithSymbol,
  lowerIncludes,
  lowerIncludesWithoutSpace,
  lowerStartsWithoutSpace,
  microFuzzy,
  removeFromPattern,
  splitRaw,
  startsSmallLetterOnlyFirst,
  synonymAliases,
} from "./strings";

// Helper to visually construct multiline test inputs without escaping backticks
// WARN: To ensure the formatter inserts a line break, we deliberately use a long variable name
const ________________________________________lines = (...xs: string[]) =>
  xs.join("\n");

describe.each<{ one: string; another: string; expected: boolean }>`
  one            | another          | expected
  ${"aaa"}       | ${"aaa"}         | ${true}
  ${" \taaa\t "} | ${"aaa"}         | ${true}
  ${"aaa"}       | ${" \taaa\t "}   | ${true}
  ${" a a a "}   | ${"\ta\ta\ta\t"} | ${true}
  ${"aaa"}       | ${"aaA"}         | ${false}
  ${" aaa "}     | ${"aaA"}         | ${false}
`("equalsAsLiterals", ({ one, another, expected }) => {
  test(`equalsAsLiterals(${one}, ${another}) = ${expected}`, () => {
    expect(equalsAsLiterals(one, another)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text            | expected
  ${"2020-01-01"} | ${true}
  ${"2.3.4"}      | ${true}
  ${"hoge2.3.4"}  | ${false}
  ${"hoge2020"}   | ${false}
`("allNumbersOrFewSymbols", ({ text, expected }) => {
  test(`allNumbersOrFewSymbols(${text}) = ${expected}`, () => {
    expect(allNumbersOrFewSymbols(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text      | expected
  ${"abc"}  | ${true}
  ${"ABC"}  | ${true}
  ${"123"}  | ${true}
  ${"aB3"}  | ${true}
  ${"a_c"}  | ${true}
  ${"a-c"}  | ${true}
  ${"あbc"} | ${false}
  ${"亜bc"} | ${false}
  ${"Ａbc"} | ${false}
`("allAlphabets", ({ text, expected }) => {
  test(`allAlphabets(${text}) = ${expected}`, () => {
    expect(allAlphabets(text)).toBe(expected);
  });
});

describe.each`
  text        | expected
  ${"aa bb"}  | ${"aabb"}
  ${" pre"}   | ${"pre"}
  ${"suf "}   | ${"suf"}
  ${" both "} | ${"both"}
  ${" a ll "} | ${"all"}
`("excludeSpace", ({ text, expected }) => {
  test(`excludeSpace(${text}) = ${expected}`, () => {
    expect(excludeSpace(text)).toBe(expected);
  });
});

describe.each`
  text          | expected
  ${"aa"}       | ${"aa"}
  ${"aa bb"}    | ${"aa%20bb"}
  ${"aa bb cc"} | ${"aa%20bb%20cc"}
  ${"aa@"}      | ${"aa@"}
`("encodeSpace", ({ text, expected }) => {
  test(`encodeSpace(${text}) = ${expected}`, () => {
    expect(encodeSpace(text)).toBe(expected);
  });
});

describe.each<{ pattern: RegExp; removeChars: string; expected: RegExp }>`
  pattern          | removeChars | expected
  ${/[abc_+-]/}    | ${"_"}      | ${/[abc+-]/}
  ${/[abc_+-]/}    | ${"+-"}     | ${/[abc_]/}
  ${/[abc_+-\/]/g} | ${"ab"}     | ${/[c_+-\/]/g}
  ${/[abc_+-\/]/g} | ${"+-"}     | ${/[abc_\/]/g}
`("removeFromPattern", ({ pattern, removeChars, expected }) => {
  test(`removeFromPattern(${pattern}, ${removeChars}) = ${expected}`, () => {
    expect(removeFromPattern(pattern, removeChars)).toStrictEqual(expected);
  });
});

describe.each`
  text           | expected
  ${"a🍰b"}      | ${"ab"}
  ${"🍰pre"}     | ${"pre"}
  ${"🍰 pre"}    | ${"pre"}
  ${"suf🍰"}     | ${"suf"}
  ${"suf 🍰"}    | ${"suf"}
  ${"🍰both😌"}  | ${"both"}
  ${"🍰a🍊ll🅰️"} | ${"all"}
  ${"🪦pre"}     | ${"pre"}
`("excludeEmoji", ({ text, expected }) => {
  test(`excludeEmoji(${text}) = ${expected}`, () => {
    expect(excludeEmoji(text)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one        | other      | expected
  ${"abcde"} | ${"cd"}    | ${true}
  ${"abcde"} | ${"bd"}    | ${false}
  ${"cd"}    | ${"abcde"} | ${false}
  ${"bd"}    | ${"abcde"} | ${false}
  ${"ABCDE"} | ${"cd"}    | ${true}
  ${"abcde"} | ${"CD"}    | ${true}
`("lowerIncludes", ({ one, other, expected }) => {
  test(`lowerIncludes(${one}, ${other}) = ${expected}`, () => {
    expect(lowerIncludes(one, other)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one         | other    | expected
  ${"ab cde"} | ${"c d"} | ${true}
  ${"AB CDE"} | ${"c d"} | ${true}
  ${"ab cde"} | ${"C D"} | ${true}
`("lowerIncludesWithoutSpace", ({ one, other, expected }) => {
  test(`lowerIncludesWithoutSpace(${one}, ${other}) = ${expected}`, () => {
    expect(lowerIncludesWithoutSpace(one, other)).toBe(expected);
  });
});

describe.each<{ one: string; other: string; expected: boolean }>`
  one          | other      | expected
  ${"abcde"}   | ${"ab"}    | ${true}
  ${"abcde"}   | ${"bc"}    | ${false}
  ${"ab"}      | ${"abcde"} | ${false}
  ${"ABCDE"}   | ${"ab"}    | ${true}
  ${"abcde"}   | ${"AB"}    | ${true}
  ${" A BCDE"} | ${"ab"}    | ${true}
  ${" a bcde"} | ${"AB"}    | ${true}
`("lowerStartsWithoutSpace", ({ one, other, expected }) => {
  test(`lowerStartsWithoutSpace(${one}, ${other}) = ${expected}`, () => {
    expect(lowerStartsWithoutSpace(one, other)).toBe(expected);
  });
});

describe.each`
  text        | expected
  ${"abc"}    | ${"Abc"}
  ${"Abc"}    | ${"Abc"}
  ${"ABC"}    | ${"ABC"}
  ${" abc"}   | ${" abc"}
  ${"あいう"} | ${"あいう"}
  ${"🍰🍴"}   | ${"🍰🍴"}
`("capitalizeFirstLetter", ({ text, expected }) => {
  test(`capitalizeFirstLetter(${text}) = ${expected}`, () => {
    expect(capitalizeFirstLetter(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text      | expected
  ${"abc"}  | ${false}
  ${"Abc"}  | ${true}
  ${"ABC"}  | ${false}
  ${" Abc"} | ${false}
  ${"🍰🍴"} | ${false}
`("startsSmallLetterOnlyFirst", ({ text, expected }) => {
  test(`startsSmallLetterOnlyFirst(${text}) = ${expected}`, () => {
    expect(startsSmallLetterOnlyFirst(text)).toBe(expected);
  });
});

describe.each<{ text: string; expected: boolean }>`
  text            | expected
  ${"abc"}        | ${false}
  ${"[[abc]]"}    | ${true}
  ${"[abc](abc)"} | ${false}
  ${" [[abc]] "}  | ${false}
`("isInternalLink", ({ text, expected }) => {
  test(`isInternalLink(${text}) = ${expected}`, () => {
    expect(isInternalLink(text)).toBe(expected);
  });
});

describe.each<{ text: string; regexp: RegExp; expected: string[] }>`
  text                      | regexp      | expected
  ${"I am tadashi-aikawa."} | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${" am tadashi-aikawa."}  | ${/[ -.]/g} | ${[" ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${"I am tadashi-aikawa"}  | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa"]}
`("splitRaw", ({ text, regexp, expected }) => {
  test(`splitRaw(${text}, ${regexp}) = ${expected}`, () => {
    expect(Array.from(splitRaw(text, regexp))).toStrictEqual(expected);
  });
});

describe.each<{ strs: string[]; expected: string | null }>`
  strs                                | expected
  ${["obsidian", "obsidian publish"]} | ${"obsidian"}
  ${["abcdefg", "abcdezz"]}           | ${"abcde"}
  ${["abcde", "abcde"]}               | ${"abcde"}
  ${[]}                               | ${null}
`("findCommonPrefix", ({ strs, expected }) => {
  test(`findCommonPrefix(${strs}) = ${expected}`, () => {
    expect(findCommonPrefix(strs)).toStrictEqual(expected);
  });
});

describe.each<{ value: string; query: string; expected: FuzzyResult }>`
  value                 | query       | expected
  ${"abcde"}            | ${"ab"}     | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"bc"}     | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"ace"}    | ${{ type: "fuzzy_match", score: 1.2 }}
  ${"abcde"}            | ${"abcde"}  | ${{ type: "concrete_match" }}
  ${"abcde"}            | ${"abcdef"} | ${{ type: "none" }}
  ${"abcde"}            | ${"bd"}     | ${{ type: "fuzzy_match", score: 0.8 }}
  ${"abcde"}            | ${"ba"}     | ${{ type: "none" }}
  ${"fuzzy name match"} | ${"match"}  | ${{ type: "fuzzy_match", score: 1.125 }}
`("microFuzzy", ({ value, query, expected }) => {
  test(`microFuzzy(${value}, ${query}) = ${expected}`, () => {
    expect(microFuzzy(value, query)).toStrictEqual(expected);
  });
});

describe.each<{
  value: Parameters<typeof synonymAliases>[0];
  emoji: Parameters<typeof synonymAliases>[1]["emoji"];
  accentsDiacritics: Parameters<typeof synonymAliases>[1]["accentsDiacritics"];
  expected: ReturnType<typeof synonymAliases>;
}>`
  value      | emoji    | accentsDiacritics | expected
  ${"cba"}   | ${true}  | ${true}           | ${[]}
  ${"cba"}   | ${true}  | ${false}          | ${[]}
  ${"cba"}   | ${false} | ${true}           | ${[]}
  ${"cba"}   | ${false} | ${false}          | ${[]}
  ${"cbá"}   | ${true}  | ${true}           | ${["cba"]}
  ${"cbá"}   | ${true}  | ${false}          | ${[]}
  ${"cbá"}   | ${false} | ${true}           | ${["cba"]}
  ${"cbá"}   | ${false} | ${false}          | ${[]}
  ${"cba😆"} | ${true}  | ${true}           | ${["cba"]}
  ${"cba😆"} | ${true}  | ${false}          | ${["cba"]}
  ${"cba😆"} | ${false} | ${true}           | ${[]}
  ${"cba😆"} | ${false} | ${false}          | ${[]}
  ${"cbá😆"} | ${true}  | ${true}           | ${["cba"]}
  ${"cbá😆"} | ${true}  | ${false}          | ${["cbá"]}
  ${"cbá😆"} | ${false} | ${true}           | ${["cba😆"]}
  ${"cbá😆"} | ${false} | ${false}          | ${[]}
`("synonymAliases", ({ value, emoji, accentsDiacritics, expected }) => {
  test(`${value} (emoji: ${emoji}, accentsDiacritics: ${accentsDiacritics})`, () => {
    expect(synonymAliases(value, { emoji, accentsDiacritics })).toStrictEqual(
      expected,
    );
  });
});

describe.each<{ tokens: string[]; expected: string[] }>`
  tokens                                                        | expected
  ${[]}                                                         | ${[]}
  ${["one"]}                                                    | ${["one"]}
  ${["1"]}                                                      | ${["1"]}
  ${["1", "."]}                                                 | ${["1."]}
  ${["1", ".", "2"]}                                            | ${["1.2"]}
  ${["1", ".", "2", ".", "3"]}                                  | ${["1.2.3"]}
  ${["hoge", "v", "1", ".", "2", ".", "3"]}                     | ${["hoge", "v", "1.2.3"]}
  ${["2", "0", "2", "0", "-", "0", "1", "-", "0", "1"]}         | ${["2020-01-01"]}
  ${["2", "0", "2", "0", "-", "0", "1", "-", "0", "1", "hoge"]} | ${["2020-01-01", "hoge"]}
`("joinNumberWithSymbol", ({ tokens, expected }) => {
  test(`joinNumberWithSymbol(${tokens}) = ${expected}`, () => {
    expect(joinNumberWithSymbol(tokens)).toStrictEqual(expected);
  });
});

describe.each<{ _description: string; text: string; expected: boolean }>([
  { _description: "空文字はコードブロック外で終了", text: "", expected: false },
  {
    _description: "通常テキストはコードブロック外で終了",
    text: ________________________________________lines(
      "Hello world",
      "This is normal text",
    ),
    expected: false,
  },
  {
    _description: "フェンス付きコードブロックが閉じて終了",
    text: ________________________________________lines(
      "```typescript",
      "const x = 1;",
      "```",
    ),
    expected: false,
  },
  {
    _description: "フェンス付きコードブロックが未閉鎖で終了",
    text: ________________________________________lines(
      "```typescript",
      "const x = 1;",
    ),
    expected: true,
  },
  {
    _description: "複数行コードブロックが未閉鎖で終了",
    text: ________________________________________lines(
      "```javascript",
      "function test() {",
      "  return 42;",
      "}",
    ),
    expected: true,
  },
  {
    _description: "チルダフェンスが閉じて終了",
    text: ________________________________________lines(
      "~~~python",
      "print('hello')",
      "~~~",
    ),
    expected: false,
  },
  {
    _description: "チルダフェンスが未閉鎖で終了",
    text: ________________________________________lines(
      "~~~python",
      "print('hello')",
    ),
    expected: true,
  },
  {
    _description: "前後に閉じたコードブロックを挟む通常テキストで終了",
    text: ________________________________________lines(
      "```js",
      "const a = 1;",
      "```",
      "",
      "Some text",
      "",
      "```ts",
      "const b = 2;",
      "```",
    ),
    expected: false,
  },
  {
    _description: "途中で未閉鎖のコードブロックで終了",
    text: ________________________________________lines(
      "```js",
      "const a = 1;",
      "```",
      "",
      "Some text",
      "",
      "```ts",
      "const b = 2;",
    ),
    expected: true,
  },
  {
    _description: "4バッククォートのコードブロックが閉じて終了",
    text: ________________________________________lines(
      "````typescript",
      "const x = 1;",
      "````",
    ),
    expected: false,
  },
  {
    _description: "4バッククォートが未閉鎖で終了",
    text: ________________________________________lines(
      "````typescript",
      "const x = 1;",
    ),
    expected: true,
  },
  {
    _description: "異なるフェンス記号で閉じず未閉鎖で終了",
    text: ________________________________________lines(
      "```typescript",
      "const x = 1;",
      "~~~",
    ),
    expected: true,
  },
  {
    _description: "4バッククォートを3で閉じず未閉鎖で終了",
    text: ________________________________________lines(
      "````typescript",
      "const x = 1;",
      "```",
    ),
    expected: true,
  },
  {
    _description: "異なる長さ(5)で閉じて終了",
    text: ________________________________________lines(
      "```typescript",
      "const x = 1;",
      "`````",
    ),
    expected: false,
  },
  {
    _description: "コード内に```を含み未閉鎖で終了",
    text: ________________________________________lines(
      "```",
      "This is ``` inside code",
      "Still in code block",
    ),
    expected: true,
  },
  {
    _description: "インデント付きフェンスは閉じて終了",
    text: ________________________________________lines(
      "  ```typescript",
      "  const x = 1;",
      "  ```",
    ),
    expected: false,
  },
  {
    _description: "言語指定前に空白のある開始フェンスで未閉鎖終了",
    text: ________________________________________lines(
      "```   typescript",
      "const x = 1;",
    ),
    expected: true,
  },
  {
    _description: "テキスト→閉じたコードブロック→テキストで終了",
    text: ________________________________________lines(
      "Regular text",
      "```python",
      "code here",
      "```",
      "More text",
    ),
    expected: false,
  },
  {
    _description: "最後のコードブロックが未閉鎖で終了",
    text: ________________________________________lines(
      "```",
      "code",
      "```",
      "",
      "```",
      "more code",
    ),
    expected: true,
  },
  {
    _description: "異種フェンス混在。最後が未閉鎖で終了",
    text: ________________________________________lines(
      "~~~js",
      "code",
      "~~~",
      "",
      "```ts",
      "unfinished",
    ),
    expected: true,
  },
  {
    _description: "連続フェンス後に未閉鎖コードで終了",
    text: ________________________________________lines(
      "```",
      "```",
      "```",
      "code",
    ),
    expected: true,
  },
])("isEOTinCodeBlock", ({ text, expected }) => {
  test(`isEOTinCodeBlock should return ${expected} for text ending ${expected ? "inside" : "outside"} code block`, () => {
    expect(isEOTinCodeBlock_(text)).toBe(expected);
  });
});
