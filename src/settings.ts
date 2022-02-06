import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import VariousComponents from "./main";
import { TokenizeStrategy } from "./tokenizer/TokenizeStrategy";
import { MatchStrategy } from "./provider/MatchStrategy";
import { CycleThroughSuggestionsKeys } from "./option/CycleThroughSuggestionsKeys";
import { ColumnDelimiter } from "./option/ColumnDelimiter";
import { SelectSuggestionKey } from "./option/SelectSuggestionKey";
import { mirrorMap } from "./util/collection-helper";

export interface Settings {
  // general
  strategy: string;
  matchStrategy: string;
  maxNumberOfSuggestions: number;
  maxNumberOfWordsAsPhrase: number;
  minNumberOfCharactersTriggered: number;
  minNumberOfWordsTriggeredPhrase: number;
  complementAutomatically: boolean;
  delayMilliSeconds: number;
  disableSuggestionsDuringImeOn: boolean;
  // FIXME: Rename at next major version up
  insertAfterCompletion: boolean;

  // key customization
  selectSuggestionKeys: string;
  additionalCycleThroughSuggestionsKeys: string;
  propagateEsc: boolean;

  // current file complement
  enableCurrentFileComplement: boolean;
  onlyComplementEnglishOnCurrentFileComplement: boolean;

  // current vault complement
  enableCurrentVaultComplement: boolean;
  includeCurrentVaultPathPrefixPatterns: string;
  excludeCurrentVaultPathPrefixPatterns: string;

  // custom dictionary complement
  enableCustomDictionaryComplement: boolean;
  customDictionaryPaths: string;
  columnDelimiter: string;
  delimiterToHideSuggestion: string;
  caretLocationSymbolAfterComplement: string;

  // internal link complement
  enableInternalLinkComplement: boolean;
  suggestInternalLinkWithAlias: boolean;

  // debug
  showLogAboutPerformanceInConsole: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  // general
  strategy: "default",
  matchStrategy: "prefix",

  maxNumberOfSuggestions: 5,
  maxNumberOfWordsAsPhrase: 3,
  minNumberOfCharactersTriggered: 0,
  minNumberOfWordsTriggeredPhrase: 1,
  complementAutomatically: true,
  delayMilliSeconds: 0,
  disableSuggestionsDuringImeOn: false,
  insertAfterCompletion: true,

  // key customization
  selectSuggestionKeys: "Enter",
  additionalCycleThroughSuggestionsKeys: "None",
  propagateEsc: false,

  // current file complement
  enableCurrentFileComplement: true,
  onlyComplementEnglishOnCurrentFileComplement: false,

  // current vault complement
  enableCurrentVaultComplement: false,
  includeCurrentVaultPathPrefixPatterns: "",
  excludeCurrentVaultPathPrefixPatterns: "",

  // custom dictionary complement
  enableCustomDictionaryComplement: false,
  customDictionaryPaths: `https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt`,
  columnDelimiter: "Tab",
  delimiterToHideSuggestion: "",
  caretLocationSymbolAfterComplement: "",

  // internal link complement
  enableInternalLinkComplement: true,
  suggestInternalLinkWithAlias: false,

  // debug
  showLogAboutPerformanceInConsole: false,
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
          await this.plugin.saveSettings({
            currentFile: true,
            currentVault: true,
          });
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
          await this.plugin.saveSettings();
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
      .setName("Max number of words as a phrase")
      .setDesc(`[⚠Warning] It makes slower more than N times (N is set value)`)
      .addSlider((sc) =>
        sc
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.maxNumberOfWordsAsPhrase)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxNumberOfWordsAsPhrase = value;
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
      .setName("Min number of words for trigger")
      .addSlider((sc) =>
        sc
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.minNumberOfWordsTriggeredPhrase)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minNumberOfWordsTriggeredPhrase = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Complement automatically")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.complementAutomatically).onChange(
          async (value) => {
            this.plugin.settings.complementAutomatically = value;
            await this.plugin.saveSettings();
          }
        );
      });

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

    containerEl.createEl("h3", { text: "Key customization" });

    new Setting(containerEl)
      .setName("Select a suggestion key")
      .addDropdown((tc) =>
        tc
          .addOptions(mirrorMap(SelectSuggestionKey.values(), (x) => x.name))
          .setValue(this.plugin.settings.selectSuggestionKeys)
          .onChange(async (value) => {
            this.plugin.settings.selectSuggestionKeys = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Additional cycle through suggestions keys")
      .addDropdown((tc) =>
        tc
          .addOptions(
            CycleThroughSuggestionsKeys.values().reduce(
              (p, c) => ({ ...p, [c.name]: c.name }),
              {}
            )
          )
          .setValue(this.plugin.settings.additionalCycleThroughSuggestionsKeys)
          .onChange(async (value) => {
            this.plugin.settings.additionalCycleThroughSuggestionsKeys = value;
            await this.plugin.saveSettings();
          })
      );

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

    containerEl.createEl("h3", {
      text: "Current file complement",
      cls: "various-complements__settings__header various-complements__settings__header__current-file",
    });

    new Setting(containerEl)
      .setName("Enable Current file complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableCurrentFileComplement).onChange(
          async (value) => {
            this.plugin.settings.enableCurrentFileComplement = value;
            await this.plugin.saveSettings({ currentFile: true });
            this.display();
          }
        );
      });

    if (this.plugin.settings.enableCurrentFileComplement) {
      new Setting(containerEl)
        .setName("Only complement English on current file complement")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.onlyComplementEnglishOnCurrentFileComplement
          ).onChange(async (value) => {
            this.plugin.settings.onlyComplementEnglishOnCurrentFileComplement =
              value;
            await this.plugin.saveSettings({ currentFile: true });
          });
        });
    }

    containerEl.createEl("h3", {
      text: "Current vault complement",
      cls: "various-complements__settings__header various-complements__settings__header__current-vault",
    });

    new Setting(containerEl)
      .setName("Enable Current vault complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableCurrentVaultComplement).onChange(
          async (value) => {
            this.plugin.settings.enableCurrentVaultComplement = value;
            await this.plugin.saveSettings({ currentVault: true });
            this.display();
          }
        );
      });

    if (this.plugin.settings.enableCurrentVaultComplement) {
      new Setting(containerEl)
        .setName("Include prefix path patterns")
        .setDesc("Prefix match path patterns to include files.")
        .addTextArea((tac) => {
          const el = tac
            .setValue(
              this.plugin.settings.includeCurrentVaultPathPrefixPatterns
            )
            .setPlaceholder("Private/")
            .onChange(async (value) => {
              this.plugin.settings.includeCurrentVaultPathPrefixPatterns =
                value;
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path";
          return el;
        });
      new Setting(containerEl)
        .setName("Exclude prefix path patterns")
        .setDesc("Prefix match path patterns to exclude files.")
        .addTextArea((tac) => {
          const el = tac
            .setValue(
              this.plugin.settings.excludeCurrentVaultPathPrefixPatterns
            )
            .setPlaceholder("Private/")
            .onChange(async (value) => {
              this.plugin.settings.excludeCurrentVaultPathPrefixPatterns =
                value;
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path";
          return el;
        });
    }

    containerEl.createEl("h3", {
      text: "Custom dictionary complement",
      cls: "various-complements__settings__header various-complements__settings__header__custom-dictionary",
    });

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
        .setDesc(
          "Specify either a relative path from Vault root or URL for each line."
        )
        .addTextArea((tac) => {
          const el = tac
            .setValue(this.plugin.settings.customDictionaryPaths)
            .setPlaceholder("dictionary.md")
            .onChange(async (value) => {
              this.plugin.settings.customDictionaryPaths = value;
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path";
          return el;
        });

      new Setting(containerEl).setName("Column delimiter").addDropdown((tc) =>
        tc
          .addOptions(
            ColumnDelimiter.values().reduce(
              (p, c) => ({ ...p, [c.name]: c.name }),
              {}
            )
          )
          .setValue(this.plugin.settings.columnDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.columnDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl)
        .setName("Delimiter to hide a suggestion")
        .setDesc(
          "If set ';;;', 'abcd;;;efg' is shown as 'abcd' on suggestions, but complements to 'abcdefg'."
        )
        .addText((cb) => {
          cb.setValue(this.plugin.settings.delimiterToHideSuggestion).onChange(
            async (value) => {
              this.plugin.settings.delimiterToHideSuggestion = value;
              await this.plugin.saveSettings();
            }
          );
        });

      new Setting(containerEl)
        .setName("Caret location symbol after complement")
        .setDesc(
          "If set '<CARET>' and there is '<li><CARET></li>' in custom dictionary, it complements '<li></li>' and move a caret where between '<li>' and `</li>`."
        )
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings.caretLocationSymbolAfterComplement
          ).onChange(async (value) => {
            this.plugin.settings.caretLocationSymbolAfterComplement = value;
            await this.plugin.saveSettings();
          });
        });
    }

    containerEl.createEl("h3", {
      text: "Internal link complement",
      cls: "various-complements__settings__header various-complements__settings__header__internal-link",
    });

    new Setting(containerEl)
      .setName("Enable Internal link complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableInternalLinkComplement).onChange(
          async (value) => {
            this.plugin.settings.enableInternalLinkComplement = value;
            await this.plugin.saveSettings({ internalLink: true });
            this.display();
          }
        );
      });

    if (this.plugin.settings.enableInternalLinkComplement) {
      new Setting(containerEl)
        .setName("Suggest with an alias")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.suggestInternalLinkWithAlias
          ).onChange(async (value) => {
            this.plugin.settings.suggestInternalLinkWithAlias = value;
            await this.plugin.saveSettings({ internalLink: true });
          });
        });
    }

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

  async toggleMatchStrategy() {
    switch (this.plugin.settings.matchStrategy) {
      case "prefix":
        this.plugin.settings.matchStrategy = "partial";
        break;
      case "partial":
        this.plugin.settings.matchStrategy = "prefix";
        break;
      default:
        // noinspection ObjectAllocationIgnored
        new Notice("⚠Unexpected error");
    }
    await this.plugin.saveSettings();
  }

  async toggleComplementAutomatically() {
    this.plugin.settings.complementAutomatically =
      !this.plugin.settings.complementAutomatically;
    await this.plugin.saveSettings();
  }

  getPluginSettingsAsJsonString(): string {
    return JSON.stringify(
      {
        version: this.plugin.manifest.version,
        mobile: (this.app as any).isMobile,
        settings: this.plugin.settings,
      },
      null,
      4
    );
  }
}
