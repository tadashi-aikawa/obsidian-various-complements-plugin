import { Plugin } from "obsidian";
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
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    await this.suggester.updateSettings(this.settings);
  }
}
