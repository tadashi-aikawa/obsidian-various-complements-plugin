import {
  arrayEquals, arrayEqualsUntil,
  groupBy,
  keyBy,
  uniq,
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
  arr                    | fn                                                 | expected
  ${["aa", "iii", "uu"]} | ${(a: string, b: string) => a.length === b.length} | ${["aa", "iii"]}
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
  arr1                   | arr2                   |  expected
  ${["aa", "iii", "uu"]} | ${["aa", "iii", "uu"]} |  ${2}
  ${[]}                  | ${[]}                  |  ${-1}
  ${["aa", "iii", "UU"]} | ${["aa", "iii", "uu"]} |  ${1}
  ${["aa", "iii"]}       | ${["aa", "iii", "uu"]} |  ${1}
  ${["aa", "iii", "uu"]}       | ${["aa", "iii"]} |  ${1}
`("arrayEqualsUntil", ({ arr1, arr2, expected }) => {
  test(`arrayEqualsUntil(${arr1}, ${arr2}) = ${expected}`, () => {
    expect(arrayEqualsUntil(arr1, arr2)).toStrictEqual(expected);
  });
});
