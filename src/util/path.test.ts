import { basename, dirname, extname } from "./path";

describe.each`
  path               | ext          | expected
  ${"a\\b\\c.txt"}   | ${undefined} | ${"c.txt"}
  ${"a/b/c.txt"}     | ${undefined} | ${"c.txt"}
  ${"a/b/c.txt.bat"} | ${undefined} | ${"c.txt.bat"}
  ${"a/b/c"}         | ${undefined} | ${"c"}
  ${"a/b/"}          | ${undefined} | ${"b"}
  ${"a/b"}           | ${undefined} | ${"b"}
  ${"a"}             | ${undefined} | ${"a"}
  ${"a\\b\\c.txt"}   | ${".txt"}    | ${"c"}
  ${"a/b/c.txt"}     | ${".txt"}    | ${"c"}
  ${"a/b/c.txt.bat"} | ${".txt"}    | ${"c.txt.bat"}
  ${"a/b/c.txt.bat"} | ${".bat"}    | ${"c.txt"}
  ${"a/b/c"}         | ${".txt"}    | ${"c"}
  ${"a/b/"}          | ${".txt"}    | ${"b"}
  ${"a/b"}           | ${".txt"}    | ${"b"}
  ${"a.txt"}         | ${".txt"}    | ${"a"}
  ${"a.txt.bat"}     | ${".txt"}    | ${"a.txt.bat"}
  ${"a.txt.bat"}     | ${".bat"}    | ${"a.txt"}
  ${"a"}             | ${".txt"}    | ${"a"}
`("basename", ({ path, ext, expected }) => {
  test(`basename(${path}, ${ext}) = ${expected}`, () => {
    expect(basename(path, ext)).toBe(expected);
  });
});

describe.each`
  path               | expected
  ${"a\\b\\c.txt"}   | ${".txt"}
  ${"a/b/c.txt"}     | ${".txt"}
  ${"a/b/c.txt.bat"} | ${".bat"}
  ${"a/b/c"}         | ${""}
  ${"a/b/"}          | ${""}
  ${"a/b"}           | ${""}
  ${"c.txt"}         | ${".txt"}
  ${"c.txt.bat"}     | ${".bat"}
  ${"c"}             | ${""}
`("extname", ({ path, expected }) => {
  test(`extname(${path}) = ${expected}`, () => {
    expect(extname(path)).toBe(expected);
  });
});

describe.each`
  path               | expected
  ${"a\\b\\c.txt"}   | ${"a\\b"}
  ${"a/b/c.txt"}     | ${"a/b"}
  ${"a/b/c.txt.bat"} | ${"a/b"}
  ${"a/b/c"}         | ${"a/b"}
  ${"a/b/"}          | ${"a"}
  ${"a/b"}           | ${"a"}
  ${"a"}             | ${"."}
`("dirname", ({ path, expected }) => {
  test(`dirname(${path}) = ${expected}`, () => {
    expect(dirname(path)).toBe(expected);
  });
});
