import { Plugin } from "obsidian";
import { AutoCompleteSuggest } from "./ui/AutoCompleteSuggest";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";
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

    this.suggester = await AutoCompleteSuggest.new(
      this.app,
      TokenizeStrategy.fromName(this.settings.strategy)
    );
    this.registerEditorSuggest(this.suggester);
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async updateStrategy(strategy: TokenizeStrategy) {
    await this.suggester.setStrategy(strategy);
  }
}
