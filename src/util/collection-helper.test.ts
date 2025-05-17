import { describe, expect, test } from "@jest/globals";
import {
  arrayEquals,
  arrayEqualsUntil,
  equalsAsSet,
  groupBy,
  mirrorMap,
  setEquals,
  uniq,
  uniqBy,
  uniqWith,
} from "./collection-helper";

describe.each<{
  values: string[];
  toKey: (x: string) => string;
  expected: { [key: string]: string[] };
}>`
  values                  | toKey                         | expected
  ${["aa", "aai", "iaa"]} | ${(x: string) => x.charAt(0)} | ${{ a: ["aa", "aai"], i: ["iaa"] }}
`("groupBy", ({ values, toKey, expected }) => {
  test(`groupBy(${values}, ${toKey}) = ${expected}`, () => {
    expect(groupBy(values, toKey)).toStrictEqual(expected);
  });
});

describe.each`
  values                  | expected
  ${["aa", "iii", "uuu"]} | ${["aa", "iii", "uuu"]}
  ${["aa", "iii", "aa"]}  | ${["aa", "iii"]}
`("uniq", ({ values, expected }) => {
  test(`uniq(${values}) = ${expected}`, () => {
    expect(uniq(values)).toStrictEqual(expected);
  });
});

describe.each<{ arr: any[]; fn: (x: any) => any; expected: any[] }>`
  arr                     | fn                         | expected
  ${["aa", "iii", "uu"]}  | ${(x: string) => x.length} | ${["aa", "iii"]}
  ${[11, 21, 31, 40, 51]} | ${(x: number) => x % 10}   | ${[11, 40]}
`("uniqBy", ({ arr, fn, expected }) => {
  test(`uniqBy(${arr}, ${fn}) = ${expected}`, () => {
    expect(uniqBy(arr, fn)).toStrictEqual(expected);
  });
});

describe.each<{ arr: any[]; fn: (a: any, b: any) => any; expected: any[] }>`
  arr                     | fn                                                 | expected
  ${["aa", "iii", "uu"]}  | ${(a: string, b: string) => a.length === b.length} | ${["aa", "iii"]}
  ${[11, 21, 31, 40, 51]} | ${(a: number, b: number) => a % 10 === b % 10}     | ${[11, 40]}
`("uniqWith", ({ arr, fn, expected }) => {
  test(`uniqWith(${arr}, ${fn}) = ${expected}`, () => {
    expect(uniqWith(arr, fn)).toStrictEqual(expected);
  });
});

describe.each<{
  arr1: unknown[];
  arr2: unknown[];
  expected: boolean;
}>`
  arr1             | arr2             | expected
  ${["aa", "iii"]} | ${["u"]}         | ${false}
  ${["aa", "iii"]} | ${["aa"]}        | ${true}
  ${["aa", "iii"]} | ${["aa", "u"]}   | ${true}
  ${["aa", "iii"]} | ${["u", "iii"]}  | ${true}
  ${["aa", "iii"]} | ${["aa", "iii"]} | ${true}
  ${["aa", "iii"]} | ${["uu", "ee"]}  | ${false}
  ${["aa"]}        | ${[]}            | ${false}
  ${[]}            | ${["aa"]}        | ${false}
  ${[]}            | ${[]}            | ${false}
`("hasSameElement", ({ arr1, arr2, expected }) => {
  test(`hasSameElement(${arr1}, ${arr2}) = ${expected}`, () => {
    expect(arr1.some((x) => arr2.includes(x))).toStrictEqual(expected);
  });
});

describe.each<{
  arr1: unknown[];
  arr2: unknown[];
  length?: number;
  expected: boolean;
}>`
  arr1                   | arr2                   | length       | expected
  ${["aa", "iii", "uu"]} | ${["aa", "iii", "uu"]} | ${undefined} | ${true}
  ${[]}                  | ${[]}                  | ${undefined} | ${true}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${undefined} | ${false}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${1}         | ${true}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${2}         | ${true}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${3}         | ${false}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${undefined} | ${false}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${1}         | ${true}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${2}         | ${true}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${3}         | ${false}
`("arrayEquals", ({ arr1, arr2, length, expected }) => {
  test(`arrayEquals(${arr1}, ${arr2}, ${length}) = ${expected}`, () => {
    expect(arrayEquals(arr1, arr2, length)).toStrictEqual(expected);
  });
});

describe.each<{ arr1: unknown[]; arr2: unknown[]; expected: number }>`
  arr1                   | arr2                   | expected
  ${["aa", "iii", "uu"]} | ${["aa", "iii", "uu"]} | ${2}
  ${[]}                  | ${[]}                  | ${-1}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${1}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${1}
  ${["aa", "iii", "uu"]} | ${["aa", "iii"]}       | ${1}
`("arrayEqualsUntil", ({ arr1, arr2, expected }) => {
  test(`arrayEqualsUntil(${arr1}, ${arr2}) = ${expected}`, () => {
    expect(arrayEqualsUntil(arr1, arr2)).toStrictEqual(expected);
  });
});

describe.each<{
  set1: Set<unknown>;
  set2: Set<unknown>;
  expected: boolean;
}>`
  set1                   | set2                   | expected
  ${["aa", "iii", "uu"]} | ${["aa", "iii", "uu"]} | ${true}
  ${[]}                  | ${[]}                  | ${true}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} | ${false}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} | ${false}
  ${["aa", "iii", "uu"]} | ${["aa", "iii"]}       | ${false}
`("setEquals", ({ set1, set2, expected }) => {
  test(`setEquals(${set1}, ${set2}) = ${expected}`, () => {
    expect(setEquals(new Set(set1), new Set(set2))).toStrictEqual(expected);
  });
});

describe.each<{ ary1: string[]; ary2: string[]; expected: boolean }>`
  ary1      | ary2      | expected
  ${[1]}    | ${[1]}    | ${true}
  ${[1, 2]} | ${[1, 2]} | ${true}
  ${[1, 2]} | ${[2, 1]} | ${true}
  ${[]}     | ${[]}     | ${true}
  ${[1]}    | ${[2]}    | ${false}
  ${[1, 2]} | ${[2, 2]} | ${false}
`("equalsAsSet", ({ ary1, ary2, expected }) => {
  test(`equalsAsSet(${ary1}, ${ary2}) = ${expected}`, () => {
    expect(equalsAsSet(ary1, ary2)).toStrictEqual(expected);
  });
});

describe.each<{
  arr: unknown[];
  toValue: (x: any) => string;
  expected: { [key: string]: unknown };
}>`
  arr                           | toValue            | expected
  ${["aa", "ii"]}               | ${(x: any) => x}   | ${{ aa: "aa", ii: "ii" }}
  ${[{ s: "aa" }, { s: "ii" }]} | ${(x: any) => x.s} | ${{ aa: "aa", ii: "ii" }}
`("mirrorMap", ({ arr, toValue, expected }) => {
  test(`mirrorMap(${arr}, ${toValue}) = ${expected}`, () => {
    expect(mirrorMap(arr, toValue)).toStrictEqual(expected);
  });
});
