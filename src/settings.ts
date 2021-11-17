import { App, PluginSettingTab, Setting } from "obsidian";
import VariousComponents from "./main";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";

export interface Settings {
  strategy: string;
}

export const DEFAULT_SETTINGS: Settings = {
  strategy: "default",
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
          await this.plugin.updateStrategy(TokenizeStrategy.fromName(value));
        })
    );
  }
}
