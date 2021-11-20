import { App, PluginSettingTab, Setting } from "obsidian";
import VariousComponents from "./main";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";

export interface Settings {
  strategy: string;
  maxNumberOfSuggestions: number;
  minNumberOfCharactersTriggered: number;
  delayMilliSeconds: number;
  customDictionaryPaths: string;
  onlySuggestFromCustomDictionaries: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  strategy: "default",
  maxNumberOfSuggestions: 5,
  minNumberOfCharactersTriggered: 0,
  delayMilliSeconds: 0,
  customDictionaryPaths: "",
  onlySuggestFromCustomDictionaries: false,
};

export class VariousComplementsSettingTab extends PluginSettingTab {
  plugin: VariousComponents;

  constructor(app: App, plugin: VariousComponents) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Various Complements - Settings" });

    new Setting(containerEl).setName("Strategy").addDropdown((tc) =>
      tc
        .addOptions(
          TokenizeStrategy.values().reduce(
            (p, c) => ({ ...p, [c.name]: c.name }),
            {}
          )
        )
        .setValue(this.plugin.settings.strategy)
        .onChange(async (value) => {
          this.plugin.settings.strategy = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName("Max number of suggestions")
      .addSlider((sc) =>
        sc
          .setLimits(5, 50, 1)
          .setValue(this.plugin.settings.maxNumberOfSuggestions)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxNumberOfSuggestions = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Min number of characters for trigger")
      .setDesc("It uses a default value of Strategy if set 0.")
      .addSlider((sc) =>
        sc
          .setLimits(0, 10, 1)
          .setValue(this.plugin.settings.minNumberOfCharactersTriggered)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minNumberOfCharactersTriggered = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Delay milli-seconds for trigger")
      .addSlider((sc) =>
        sc
          .setLimits(0, 10000, 10)
          .setValue(this.plugin.settings.delayMilliSeconds)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.delayMilliSeconds = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Custom dictionary paths")
      .addTextArea((tac) =>
        tac
          .setValue(this.plugin.settings.customDictionaryPaths)
          .onChange(async (value) => {
            this.plugin.settings.customDictionaryPaths = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Only suggest from custom dictionaries")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.onlySuggestFromCustomDictionaries
        ).onChange(async (value) => {
          this.plugin.settings.onlySuggestFromCustomDictionaries = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
