import {
  arrayEquals,
  arrayEqualsUntil,
  groupBy,
  keyBy,
  mirrorMap,
  uniq,
  uniqBy,
  uniqWith,
} from "./collection-helper";

describe.each`
  values                 | toKey                      | expected
  ${["aa", "iii", "u"]}  | ${(x: string) => x.length} | ${{ 1: "u", 2: "aa", 3: "iii" }}
  ${["aa", "iii", "uu"]} | ${(x: string) => x.length} | ${{ 2: "uu", 3: "iii" }}
`("keyBy", ({ values, toKey, expected }) => {
  test(`keyBy(${values}, ${toKey}) = ${expected}`, () => {
    expect(keyBy(values, toKey)).toStrictEqual(expected);
  });
});

describe.each`
  values                 | toKey                      | expected
  ${["aa", "iii", "u"]}  | ${(x: string) => x.length} | ${{ 1: ["u"], 2: ["aa"], 3: ["iii"] }}
  ${["aa", "iii", "uu"]} | ${(x: string) => x.length} | ${{ 2: ["aa", "uu"], 3: ["iii"] }}
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

describe.each`
  arr                     | fn                         | expected
  ${["aa", "iii", "uu"]}  | ${(x: string) => x.length} | ${["aa", "iii"]}
  ${[11, 21, 31, 40, 51]} | ${(x: number) => x % 10}   | ${[11, 40]}
`("uniqBy", ({ arr, fn, expected }) => {
  test(`uniqBy(${arr}, ${fn}) = ${expected}`, () => {
    expect(uniqBy(arr, fn)).toStrictEqual(expected);
  });
});

describe.each`
  arr                     | fn                                                 | expected
  ${["aa", "iii", "uu"]}  | ${(a: string, b: string) => a.length === b.length} | ${["aa", "iii"]}
  ${[11, 21, 31, 40, 51]} | ${(a: number, b: number) => a % 10 === b % 10}     | ${[11, 40]}
`("uniqWith", ({ arr, fn, expected }) => {
  test(`uniqWith(${arr}, ${fn}) = ${expected}`, () => {
    expect(uniqWith(arr, fn)).toStrictEqual(expected);
  });
});

describe.each`
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

describe.each`
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

describe.each`
  arr                           | toValue            | expected
  ${["aa", "ii"]}               | ${(x: any) => x}   | ${{ aa: "aa", ii: "ii" }}
  ${[{ s: "aa" }, { s: "ii" }]} | ${(x: any) => x.s} | ${{ aa: "aa", ii: "ii" }}
`("mirrorMap", ({ arr, toValue, expected }) => {
  test(`mirrorMap(${arr}, ${toValue}) = ${expected}`, () => {
    expect(mirrorMap(arr, toValue)).toStrictEqual(expected);
  });
});
