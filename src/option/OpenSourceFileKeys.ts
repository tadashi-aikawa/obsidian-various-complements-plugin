import { Modifier } from "obsidian";

type Name = "None" | "Ctrl/Cmd+Enter" | "Alt+Enter" | "Shift+Enter";
interface KeyBind {
  modifiers: Modifier[];
  key: string | null;
}

export class OpenSourceFileKeys {
  private static readonly _values: OpenSourceFileKeys[] = [];

  static readonly NONE = new OpenSourceFileKeys("None", {
    modifiers: [],
    key: null,
  });
  static readonly MOD_ENTER = new OpenSourceFileKeys("Ctrl/Cmd+Enter", {
    modifiers: ["Mod"],
    key: "Enter",
  });
  static readonly ALT_ENTER = new OpenSourceFileKeys("Alt+Enter", {
    modifiers: ["Alt"],
    key: "Enter",
  });
  static readonly SHIFT_ENTER = new OpenSourceFileKeys("Shift+Enter", {
    modifiers: ["Shift"],
    key: "Enter",
  });

  private constructor(readonly name: Name, readonly keyBind: KeyBind) {
    OpenSourceFileKeys._values.push(this);
  }

  static fromName(name: string): OpenSourceFileKeys {
    return OpenSourceFileKeys._values.find((x) => x.name === name)!;
  }

  static values(): OpenSourceFileKeys[] {
    return OpenSourceFileKeys._values;
  }
}
