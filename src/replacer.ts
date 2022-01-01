import { excludeEmoji } from "./util/strings";
import { arrayEqualsUntil } from "./util/collection-helper";
import { Tokenizer } from "./tokenizer/tokenizer";

export function suggestCh(
  tokenizer: Tokenizer,
  currentLineUntilCursor: string,
  word: string,
  contextStartCh: number
): number {
  const currentLineTokensUntilCursor = tokenizer
    .tokenize(currentLineUntilCursor, true)
    .map((x) => x.toLowerCase());
  const currentToken = currentLineTokensUntilCursor.last()!;
  const currentLineTokensReversed = currentLineTokensUntilCursor
    .slice(0, -1)
    .reverse();

  const suggestionTokensReversed = tokenizer
    .tokenize(excludeEmoji(word), true)
    .map((x) => x.toLowerCase())
    .reverse();

  const i = suggestionTokensReversed.indexOf(currentLineTokensReversed[0]);
  const judgementTokens = suggestionTokensReversed.slice(i);

  const untilEqualIndex = arrayEqualsUntil(
    currentLineTokensReversed,
    judgementTokens
  );

  return untilEqualIndex === -1
    ? contextStartCh
    : currentLineUntilCursor
        .slice(0, -currentToken.length)
        .toLowerCase()
        .lastIndexOf(judgementTokens[untilEqualIndex]);
}
