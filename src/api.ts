import type { VariousComplementsSettingTab } from "./setting/settings";

export function createApi(settingTab: VariousComplementsSettingTab): PublicAPI {
  return new PublicAPIImpl(settingTab);
}

export interface PublicAPI {
  /**
   * Example:
   * ```typescript
   * const api = app.plugins.plugins["various-complements"].api
   *
   * api.isFeatureSupported("ensureCustomDictionaryPath") // true
   * api.isFeatureSupported("hogehoge") // false
   * ```
   */
  isFeatureSupported(featureName: string): boolean;

  /**
   * Ensure that there is a custom dictionary path or not.
   * This function guarantees idempotency.
   *
   * @return Custom dictionary path is updated or not
   *
   * Example:
   * ```typescript
   * const api = app.plugins.plugins["various-complements"].api
   *
   * api.ensureCustomDictionaryPath("./your-dictionary.md", "present")
   * api.ensureCustomDictionaryPath("https://your-dictionary/files.csv", "absent")
   * ```
   */
  ensureCustomDictionaryPath(
    path: string,
    state: "present" | "absent"
  ): Promise<boolean>;
}

class PublicAPIImpl implements PublicAPI {
  constructor(public settingTab: VariousComplementsSettingTab) {}

  ensureCustomDictionaryPath(
    path: string,
    state: "present" | "absent"
  ): Promise<boolean> {
    if (state !== "present" && state !== "absent") {
      throw new TypeError("state must be 'present' or 'absent'");
    }
    return this.settingTab.ensureCustomDictionaryPath(path, state);
  }

  isFeatureSupported(featureName: string): boolean {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter((x) => x !== "constructor")
      .includes(featureName);
  }
}
