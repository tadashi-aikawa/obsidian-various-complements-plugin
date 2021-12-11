import { Modifier } from "obsidian";

type Name = "None" | "Tab/Shift+Tab" | "Mod+N/Mod+P" | "Mod+J/Mod+K";
interface KeyBind {
  modifiers: Modifier[];
  key: string | null;
}

export class CycleThroughSuggestionsKeys {
  private static readonly _values: CycleThroughSuggestionsKeys[] = [];

  static readonly NONE = new CycleThroughSuggestionsKeys(
    "None",
    { modifiers: [], key: null },
    { modifiers: [], key: null }
  );
  static readonly TAB = new CycleThroughSuggestionsKeys(
    "Tab/Shift+Tab",
    { modifiers: [], key: "Tab" },
    { modifiers: ["Shift"], key: "Tab" }
  );
  static readonly EMACS = new CycleThroughSuggestionsKeys(
    "Mod+N/Mod+P",
    { modifiers: ["Mod"], key: "N" },
    { modifiers: ["Mod"], key: "P" }
  );
  static readonly VIM = new CycleThroughSuggestionsKeys(
    "Mod+J/Mod+K",
    { modifiers: ["Mod"], key: "J" },
    { modifiers: ["Mod"], key: "K" }
  );

  private constructor(
    readonly name: Name,
    readonly nextKey: KeyBind,
    readonly previousKey: KeyBind
  ) {
    CycleThroughSuggestionsKeys._values.push(this);
  }

  static fromName(name: string): CycleThroughSuggestionsKeys {
    return CycleThroughSuggestionsKeys._values.find((x) => x.name === name)!;
  }

  static values(): CycleThroughSuggestionsKeys[] {
    return CycleThroughSuggestionsKeys._values;
  }
}
