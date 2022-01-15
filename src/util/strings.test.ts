import {
  allAlphabets,
  capitalizeFirstLetter,
  excludeEmoji,
  lowerIncludes,
  splitRaw,
} from "./strings";

describe.each`
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
  text           | expected
  ${"a🍰b"}      | ${"ab"}
  ${"🍰pre"}     | ${"pre"}
  ${"suf🍰"}     | ${"suf"}
  ${"🍰both😌"}  | ${"both"}
  ${"🍰a🍊ll🅰️"} | ${"all"}
`("excludeEmoji", ({ text, expected }) => {
  test(`excludeEmoji(${text}) = ${expected}`, () => {
    expect(excludeEmoji(text)).toBe(expected);
  });
});

describe.each`
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

describe.each`
  text                      | regexp      | expected
  ${"I am tadashi-aikawa."} | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${" am tadashi-aikawa."}  | ${/[ -.]/g} | ${[" ", "am", " ", "tadashi", "-", "aikawa", "."]}
  ${"I am tadashi-aikawa"}  | ${/[ -.]/g} | ${["I", " ", "am", " ", "tadashi", "-", "aikawa"]}
`("splitRaw", ({ text, regexp, expected }) => {
  test(`splitRaw(${text}, ${regexp}) = ${expected}`, () => {
    expect(Array.from(splitRaw(text, regexp))).toStrictEqual(expected);
  });
});
