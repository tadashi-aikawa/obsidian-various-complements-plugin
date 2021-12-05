import { App, PluginSettingTab, Setting } from "obsidian";
import VariousComponents from "./main";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";
import { MatchStrategy } from "./provider/MatchStrategy";

export interface Settings {
  strategy: string;
  matchStrategy: string;
  maxNumberOfSuggestions: number;
  minNumberOfCharactersTriggered: number;
  delayMilliSeconds: number;
  customDictionaryPaths: string;
  propagateEsc: boolean;
  enableCurrentFileComplement: boolean;
  enableCustomDictionaryComplement: boolean;
  enableInternalLinkComplement: boolean;
  disableSuggestionsDuringImeOn: boolean;
  showLogAboutPerformanceInConsole: boolean;
  insertAfterCompletion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  strategy: "default",
  matchStrategy: "prefix",
  maxNumberOfSuggestions: 5,
  minNumberOfCharactersTriggered: 0,
  delayMilliSeconds: 0,
  customDictionaryPaths: "",
  propagateEsc: false,
  enableCurrentFileComplement: true,
  enableCustomDictionaryComplement: false,
  enableInternalLinkComplement: true,
  disableSuggestionsDuringImeOn: false,
  showLogAboutPerformanceInConsole: false,
  insertAfterCompletion: true,
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

    containerEl.createEl("h3", { text: "Main" });

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
          await this.plugin.saveSettings({ currentFile: true });
        })
    );

    new Setting(containerEl).setName("Match strategy").addDropdown((tc) =>
      tc
        .addOptions(
          MatchStrategy.values().reduce(
            (p, c) => ({ ...p, [c.name]: c.name }),
            {}
          )
        )
        .setValue(this.plugin.settings.matchStrategy)
        .onChange(async (value) => {
          this.plugin.settings.matchStrategy = value;
          await this.plugin.saveSettings({ currentFile: true });
          this.display();
        })
    );
    if (this.plugin.settings.matchStrategy === MatchStrategy.PARTIAL.name) {
      containerEl.createEl("div", {
        text: "⚠ `partial` is more than 10 times slower than `prefix`",
        cls: "various-complements__settings__warning",
      });
    }

    new Setting(containerEl)
      .setName("Max number of suggestions")
      .addSlider((sc) =>
        sc
          .setLimits(1, 255, 1)
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
          .setLimits(0, 1000, 10)
          .setValue(this.plugin.settings.delayMilliSeconds)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.delayMilliSeconds = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Disable suggestions during IME on")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.disableSuggestionsDuringImeOn
        ).onChange(async (value) => {
          this.plugin.settings.disableSuggestionsDuringImeOn = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Insert space after completion")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.insertAfterCompletion).onChange(
          async (value) => {
            this.plugin.settings.insertAfterCompletion = value;
            await this.plugin.saveSettings();
          }
        );
      });

    new Setting(containerEl)
      .setName("Propagate ESC")
      .setDesc(
        "It is handy if you use Vim mode because you can switch to Normal mode by one ESC, whether it shows suggestions or not."
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.propagateEsc).onChange(
          async (value) => {
            this.plugin.settings.propagateEsc = value;
            await this.plugin.saveSettings();
          }
        );
      });

    containerEl.createEl("h3", { text: "Current file complement" });

    new Setting(containerEl)
      .setName("Enable Current file complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableCurrentFileComplement).onChange(
          async (value) => {
            this.plugin.settings.enableCurrentFileComplement = value;
            await this.plugin.saveSettings({ currentFile: true });
          }
        );
      });

    containerEl.createEl("h3", { text: "Custom dictionary complement" });

    new Setting(containerEl)
      .setName("Enable Custom dictionary complement")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.enableCustomDictionaryComplement
        ).onChange(async (value) => {
          this.plugin.settings.enableCustomDictionaryComplement = value;
          await this.plugin.saveSettings({ customDictionary: true });
          this.display();
        });
      });

    if (this.plugin.settings.enableCustomDictionaryComplement) {
      new Setting(containerEl)
        .setName("Custom dictionary paths")
        .setDesc("For each line, specify a relative path from Vault root.")
        .addTextArea((tac) => {
          const el = tac
            .setValue(this.plugin.settings.customDictionaryPaths)
            .setPlaceholder("dictionary.md")
            .onChange(async (value) => {
              this.plugin.settings.customDictionaryPaths = value;
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__custom-dictionary-paths";
          return el;
        });
    }

    containerEl.createEl("h3", { text: "Internal link complement" });

    new Setting(containerEl)
      .setName("Enable Internal link complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableInternalLinkComplement).onChange(
          async (value) => {
            this.plugin.settings.enableInternalLinkComplement = value;
            await this.plugin.saveSettings({ internalLink: true });
          }
        );
      });

    containerEl.createEl("h3", { text: "Debug" });

    new Setting(containerEl)
      .setName("Show log about performance in a console")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.showLogAboutPerformanceInConsole
        ).onChange(async (value) => {
          this.plugin.settings.showLogAboutPerformanceInConsole = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
