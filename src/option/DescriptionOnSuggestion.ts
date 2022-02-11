import { Word } from "../model/Word";
import { basename } from "../util/path";

export class DescriptionOnSuggestion {
  private static readonly _values: DescriptionOnSuggestion[] = [];

  static readonly NONE = new DescriptionOnSuggestion("None", () => null);
  static readonly SHORT = new DescriptionOnSuggestion("Short", (word) => {
    if (!word.description) {
      return null;
    }
    return word.type === "customDictionary"
      ? word.description
      : basename(word.description);
  });
  static readonly FULL = new DescriptionOnSuggestion(
    "Full",
    (word) => word.description ?? null
  );

  private constructor(
    readonly name: string,
    readonly toDisplay: (word: Word) => string | null
  ) {
    DescriptionOnSuggestion._values.push(this);
  }

  static fromName(name: string): DescriptionOnSuggestion {
    return DescriptionOnSuggestion._values.find((x) => x.name === name)!;
  }

  static values(): DescriptionOnSuggestion[] {
    return DescriptionOnSuggestion._values;
  }
}
