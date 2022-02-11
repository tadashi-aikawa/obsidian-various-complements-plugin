import { Modifier } from "obsidian";

type Name = "None" | "Ctrl/Cmd+Enter" | "Alt+Enter" | "Shift+Enter";
interface KeyBind {
  modifiers: Modifier[];
  key: string | null;
}

export class MoveToSourceFileKeys {
  private static readonly _values: MoveToSourceFileKeys[] = [];

  static readonly NONE = new MoveToSourceFileKeys("None", {
    modifiers: [],
    key: null,
  });
  static readonly MOD_ENTER = new MoveToSourceFileKeys("Ctrl/Cmd+Enter", {
    modifiers: ["Mod"],
    key: "Enter",
  });
  static readonly ALT_ENTER = new MoveToSourceFileKeys("Alt+Enter", {
    modifiers: ["Alt"],
    key: "Enter",
  });
  static readonly SHIFT_ENTER = new MoveToSourceFileKeys("Shift+Enter", {
    modifiers: ["Shift"],
    key: "Enter",
  });

  private constructor(readonly name: Name, readonly keyBind: KeyBind) {
    MoveToSourceFileKeys._values.push(this);
  }

  static fromName(name: string): MoveToSourceFileKeys {
    return MoveToSourceFileKeys._values.find((x) => x.name === name)!;
  }

  static values(): MoveToSourceFileKeys[] {
    return MoveToSourceFileKeys._values;
  }
}
