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

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    await this.suggester.updateSettings(this.settings);
  }

  async reloadCustomDictionaries() {
    await this.suggester.refreshCustomTokens();
  }
}
