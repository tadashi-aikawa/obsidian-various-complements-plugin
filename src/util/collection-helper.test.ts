import { groupBy, keyBy, uniq, uniqWith } from "./collection-helper";

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
