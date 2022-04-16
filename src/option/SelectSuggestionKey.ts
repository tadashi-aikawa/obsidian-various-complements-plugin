import type { Modifier } from "obsidian";

type Name =
  | "Enter"
  | "Tab"
  | "Ctrl/Cmd+Enter"
  | "Alt+Enter"
  | "Shift+Enter"
  | "Space";
interface KeyBind {
  modifiers: Modifier[];
  key: string | null;
}

export class SelectSuggestionKey {
  private static readonly _values: SelectSuggestionKey[] = [];

  static readonly ENTER = new SelectSuggestionKey("Enter", {
    modifiers: [],
    key: "Enter",
  });
  static readonly TAB = new SelectSuggestionKey("Tab", {
    modifiers: [],
    key: "Tab",
  });
  static readonly MOD_ENTER = new SelectSuggestionKey("Ctrl/Cmd+Enter", {
    modifiers: ["Mod"],
    key: "Enter",
  });
  static readonly ALT_ENTER = new SelectSuggestionKey("Alt+Enter", {
    modifiers: ["Alt"],
    key: "Enter",
  });
  static readonly SHIFT_ENTER = new SelectSuggestionKey("Shift+Enter", {
    modifiers: ["Shift"],
    key: "Enter",
  });
  static readonly SPACE = new SelectSuggestionKey("Space", {
    modifiers: [],
    key: " ",
  });

  private constructor(readonly name: Name, readonly keyBind: KeyBind) {
    SelectSuggestionKey._values.push(this);
  }

  static fromName(name: string): SelectSuggestionKey {
    return SelectSuggestionKey._values.find((x) => x.name === name)!;
  }

  static values(): SelectSuggestionKey[] {
    return SelectSuggestionKey._values;
  }
}
