import { type Modifier, Platform } from "obsidian";
import { equalsAsSet } from "./util/collection-helper";

export const MOD = Platform.isMacOS ? "Cmd" : "Ctrl";
export const ALT = Platform.isMacOS ? "Option" : "Alt";

export const quickResultSelectionModifier = (
  userAltInsteadOfModForQuickResultSelection: boolean,
) => (userAltInsteadOfModForQuickResultSelection ? ALT : MOD);

export type Hotkey = {
  modifiers: Modifier[];
  key: string;
  hideHotkeyGuide?: boolean;
};

export function hotkey2String(hk?: Hotkey): string {
  if (!hk) {
    return "";
  }

  const hotkey = hk.key === " " ? "Space" : hk.key;
  const mods = hk.modifiers.join(" ");

  return mods ? `${mods} ${hotkey}` : hotkey;
}

export function string2Hotkey(
  hotKey: string,
  hideHotkeyGuide: boolean,
): Hotkey | null {
  const keys = hotKey.split(" ");

  if (keys.length === 0 || keys[0] === "") {
    return null;
  }
  if (keys.length === 1) {
    return {
      modifiers: [],
      key: keys[0].replace("Space", " "),
      hideHotkeyGuide,
    };
  }
  return {
    modifiers: keys.slice(0, -1) as Modifier[],
    key: keys.last()!.replace("Space", " "),
    hideHotkeyGuide,
  };
}

export function equalsAsHotkey(
  hotkey: Hotkey,
  keyDownEvent: KeyboardEvent,
): boolean {
  const hk: Hotkey = { modifiers: [], key: keyDownEvent.key };
  if (keyDownEvent.shiftKey) {
    hk.modifiers.push("Shift");
  }
  if (keyDownEvent.altKey) {
    hk.modifiers.push("Alt");
  }
  if (keyDownEvent.ctrlKey) {
    hk.modifiers.push(Platform.isMacOS ? "Ctrl" : "Mod");
  }
  if (keyDownEvent.metaKey) {
    hk.modifiers.push(Platform.isMacOS ? "Mod" : "Meta");
  }

  return (
    hotkey.key.toLowerCase() === hk.key.toLowerCase() &&
    equalsAsSet(hotkey.modifiers, hk.modifiers)
  );
}
