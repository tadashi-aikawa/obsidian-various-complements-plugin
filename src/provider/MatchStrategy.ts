import { IndexedWords } from "../ui/AutoCompleteSuggest";
import { suggestWords, suggestWordsByPartialMatch } from "./suggester";
import { Word } from "../model/Word";

type Name = "prefix" | "partial";

type Handler = (
  indexedWords: IndexedWords,
  query: string,
  max: number,
  frontMatter: string | null
) => Word[];

export class MatchStrategy {
  private static readonly _values: MatchStrategy[] = [];

  static readonly PREFIX = new MatchStrategy("prefix", suggestWords);
  static readonly PARTIAL = new MatchStrategy(
    "partial",
    suggestWordsByPartialMatch
  );

  private constructor(readonly name: Name, readonly handler: Handler) {
    MatchStrategy._values.push(this);
  }

  static fromName(name: string): MatchStrategy {
    return MatchStrategy._values.find((x) => x.name === name)!;
  }

  static values(): MatchStrategy[] {
    return MatchStrategy._values;
  }
}
