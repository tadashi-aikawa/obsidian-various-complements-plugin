import { Notice, Plugin } from "obsidian";
import { AutoCompleteSuggest } from "./ui/AutoCompleteSuggest";
import {
  DEFAULT_SETTINGS,
  Settings,
  VariousComplementsSettingTab,
} from "./settings";

export default class VariousComponents extends Plugin {
  settings: Settings;
  suggester: AutoCompleteSuggest;

  onunload() {
    super.onunload();
    this.suggester.unregister();
  }

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VariousComplementsSettingTab(this.app, this));

    this.suggester = await AutoCompleteSuggest.new(this.app, this.settings);
    this.registerEditorSuggest(this.suggester);

    this.addCommand({
      id: "reload-custom-dictionaries",
      name: "Reload custom dictionaries",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }],
      callback: async () => {
        await this.reloadCustomDictionaries();
        // noinspection ObjectAllocationIgnored
        new Notice(`Finish reload custom dictionaries`);
      },
    });

    this.addCommand({
      id: "toggle-auto-complete",
      name: "Toggle Auto-complete",
      hotkeys: [{ modifiers: ["Mod"], key: " " }],
      callback: async () => {
        await this.suggester.toggleEnabled();
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(
    needUpdateTokens: {
      currentFile?: boolean;
      customDictionary?: boolean;
      internalLink?: boolean;
    } = {}
  ): Promise<void> {
    await this.saveData(this.settings);
    await this.suggester.updateSettings(this.settings);
    if (needUpdateTokens.currentFile) {
      await this.suggester.refreshCurrentFileTokens();
    }
    if (needUpdateTokens.customDictionary) {
      await this.suggester.refreshCustomDictionaryTokens();
    }
    if (needUpdateTokens.internalLink) {
      await this.suggester.refreshInternalLinkTokens();
    }
  }

  async reloadCustomDictionaries(): Promise<void> {
    await this.suggester.refreshCustomDictionaryTokens();
  }
}
