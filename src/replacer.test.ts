import { suggestCh } from "./replacer";
import { createTokenizer } from "./tokenizer/tokenizer";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";

// Emoji uses 2 indexes (It means that "😀a".indexOf("a") is not 1, but 2)
describe.each`
  tokenizerStrategy            | currentLineUntilCursor       | word                  | contextStartCh | expected
  ${TokenizeStrategy.DEFAULT}  | ${"aa bb c"}                 | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.DEFAULT}  | ${"aa bb c"}                 | ${"AA bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.DEFAULT}  | ${"AA bb c"}                 | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.DEFAULT}  | ${"😀aa bb c"}               | ${"aa bb ccc"}        | ${8}           | ${5}
  ${TokenizeStrategy.DEFAULT}  | ${"aa bb c"}                 | ${"😀aa bb ccc"}      | ${6}           | ${0}
  ${TokenizeStrategy.DEFAULT}  | ${"aa bb ccc"}               | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.DEFAULT}  | ${"zz bb ccc"}               | ${"aa bb ccc"}        | ${6}           | ${3}
  ${TokenizeStrategy.DEFAULT}  | ${"zz yy ccc"}               | ${"aa bb ccc"}        | ${6}           | ${6}
  ${TokenizeStrategy.DEFAULT}  | ${"aa bb cc bb"}             | ${"aa bb ccc"}        | ${9}           | ${9}
  ${TokenizeStrategy.JAPANESE} | ${"aa bb c"}                 | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"aa bb c"}                 | ${"AA bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"AA bb c"}                 | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"😀aa bb c"}               | ${"aa bb ccc"}        | ${8}           | ${2}
  ${TokenizeStrategy.JAPANESE} | ${"aa bb c"}                 | ${"😀aa bb ccc"}      | ${6}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"aa bb ccc"}               | ${"aa bb ccc"}        | ${6}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"zz bb ccc"}               | ${"aa bb ccc"}        | ${6}           | ${3}
  ${TokenizeStrategy.JAPANESE} | ${"zz yy ccc"}               | ${"aa bb ccc"}        | ${6}           | ${6}
  ${TokenizeStrategy.JAPANESE} | ${"aa bb cc bb"}             | ${"aa bb ccc"}        | ${9}           | ${9}
  ${TokenizeStrategy.JAPANESE} | ${"旧市街"}                  | ${"イーディス旧市街"} | ${0}           | ${0}
  ${TokenizeStrategy.JAPANESE} | ${"これから行くのは旧市街"}  | ${"イーディス旧市街"} | ${0}           | ${8}
  ${TokenizeStrategy.JAPANESE} | ${"これから行くのは 旧市街"} | ${"イーディス旧市街"} | ${9}           | ${9}
`(
  "suggestCh",
  ({
    tokenizerStrategy,
    currentLineUntilCursor,
    word,
    contextStartCh,
    expected,
  }) => {
    test(`suggestCh(${tokenizerStrategy.name}, ${currentLineUntilCursor}, ${word}, ${contextStartCh}) = ${expected}`, () => {
      expect(
        suggestCh(
          createTokenizer(tokenizerStrategy),
          currentLineUntilCursor,
          word,
          contextStartCh
        )
      ).toBe(expected);
    });
  }
);
