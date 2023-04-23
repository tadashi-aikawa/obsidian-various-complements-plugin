import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type VariousComponents from "../main";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { MatchStrategy } from "../provider/MatchStrategy";
import { CycleThroughSuggestionsKeys } from "../option/CycleThroughSuggestionsKeys";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { SelectSuggestionKey } from "../option/SelectSuggestionKey";
import { mirrorMap } from "../util/collection-helper";
import { OpenSourceFileKeys } from "../option/OpenSourceFileKeys";
import { DescriptionOnSuggestion } from "../option/DescriptionOnSuggestion";
import { SpecificMatchStrategy } from "../provider/SpecificMatchStrategy";
import type { SelectionHistoryTree } from "../storage/SelectionHistoryStorage";
import { smartLineBreakSplit } from "../util/strings";
import { TextComponentEvent } from "./settings-helper";
import { DEFAULT_HISTORIES_PATH } from "../util/path";

export interface Settings {
  // general
  strategy: string;
  cedictPath: string;
  matchStrategy: string;
  fuzzyMatch: boolean;
  matchingWithoutEmoji: boolean;
  treatAccentDiacriticsAsAlphabeticCharacters: boolean;
  maxNumberOfSuggestions: number;
  maxNumberOfWordsAsPhrase: number;
  minNumberOfCharactersTriggered: number;
  minNumberOfWordsTriggeredPhrase: number;
  complementAutomatically: boolean;
  delayMilliSeconds: number;
  disableSuggestionsDuringImeOn: boolean;
  // FIXME: Rename at next major version up
  insertAfterCompletion: boolean;
  firstCharactersDisableSuggestions: string;
  useCommonPrefixCompletionOfSuggestion: boolean;
  patternsToSuppressTrigger: string[];

  // appearance
  showMatchStrategy: boolean;
  showComplementAutomatically: boolean;
  showIndexingStatus: boolean;
  descriptionOnSuggestion: string;

  // key customization
  selectSuggestionKeys: string;
  additionalCycleThroughSuggestionsKeys: string;
  disableUpDownKeysForCycleThroughSuggestionsKeys: boolean;
  openSourceFileKey: string;
  propagateEsc: boolean;

  // current file complement
  enableCurrentFileComplement: boolean;
  currentFileMinNumberOfCharacters: number;
  onlyComplementEnglishOnCurrentFileComplement: boolean;

  // current vault complement
  enableCurrentVaultComplement: boolean;
  currentVaultMinNumberOfCharacters: number;
  includeCurrentVaultPathPrefixPatterns: string;
  excludeCurrentVaultPathPrefixPatterns: string;
  includeCurrentVaultOnlyFilesUnderCurrentDirectory: boolean;

  // custom dictionary complement
  enableCustomDictionaryComplement: boolean;
  customDictionaryPaths: string;
  columnDelimiter: string;
  customDictionaryWordRegexPattern: string;
  delimiterToHideSuggestion: string;
  delimiterToDivideSuggestionsForDisplayFromInsertion: string;
  caretLocationSymbolAfterComplement: string;
  displayedTextSuffix: string;

  // internal link complement
  enableInternalLinkComplement: boolean;
  suggestInternalLinkWithAlias: boolean;
  excludeInternalLinkPathPrefixPatterns: string;
  updateInternalLinksOnSave: boolean;
  insertAliasTransformedFromDisplayedInternalLink: {
    enabled: boolean;
    beforeRegExp: string;
    after: string;
  };
  frontMatterKeyForExclusionInternalLink: string;

  // front matter complement
  enableFrontMatterComplement: boolean;
  frontMatterComplementMatchStrategy: string;
  insertCommaAfterFrontMatterCompletion: boolean;

  intelligentSuggestionPrioritization: {
    historyFilePath: string;
    // If set 0, it will never remove
    maxDaysToKeepHistory: number;
    // If set 0, it will never remove
    maxNumberOfHistoryToKeep: number;
  };

  // mobile
  disableOnMobile: boolean;

  // debug
  showLogAboutPerformanceInConsole: boolean;

  // others
  // TODO: Want to remove in the future version
  selectionHistoryTree: SelectionHistoryTree;
}

export const DEFAULT_SETTINGS: Settings = {
  // general
  strategy: "default",
  cedictPath: "./cedict_ts.u8",
  matchStrategy: "prefix",
  fuzzyMatch: true,
  matchingWithoutEmoji: true,
  treatAccentDiacriticsAsAlphabeticCharacters: false,

  maxNumberOfSuggestions: 5,
  maxNumberOfWordsAsPhrase: 3,
  minNumberOfCharactersTriggered: 0,
  minNumberOfWordsTriggeredPhrase: 1,
  complementAutomatically: true,
  delayMilliSeconds: 0,
  disableSuggestionsDuringImeOn: false,
  insertAfterCompletion: true,
  firstCharactersDisableSuggestions: ":/^",
  useCommonPrefixCompletionOfSuggestion: false,
  patternsToSuppressTrigger: ["^~~~.*", "^```.*"],

  // appearance
  showMatchStrategy: true,
  showComplementAutomatically: true,
  showIndexingStatus: true,
  descriptionOnSuggestion: "Short",

  // key customization
  selectSuggestionKeys: "Enter",
  additionalCycleThroughSuggestionsKeys: "None",
  disableUpDownKeysForCycleThroughSuggestionsKeys: false,
  openSourceFileKey: "None",
  propagateEsc: false,

  // current file complement
  enableCurrentFileComplement: true,
  currentFileMinNumberOfCharacters: 0,
  onlyComplementEnglishOnCurrentFileComplement: false,

  // current vault complement
  enableCurrentVaultComplement: false,
  currentVaultMinNumberOfCharacters: 0,
  includeCurrentVaultPathPrefixPatterns: "",
  excludeCurrentVaultPathPrefixPatterns: "",
  includeCurrentVaultOnlyFilesUnderCurrentDirectory: false,

  // custom dictionary complement
  enableCustomDictionaryComplement: false,
  customDictionaryPaths: `https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt`,
  columnDelimiter: "Tab",
  customDictionaryWordRegexPattern: "",
  delimiterToHideSuggestion: "",
  delimiterToDivideSuggestionsForDisplayFromInsertion: "",
  caretLocationSymbolAfterComplement: "",
  displayedTextSuffix: " => ...",

  // internal link complement
  enableInternalLinkComplement: true,
  suggestInternalLinkWithAlias: false,
  excludeInternalLinkPathPrefixPatterns: "",
  updateInternalLinksOnSave: true,
  insertAliasTransformedFromDisplayedInternalLink: {
    enabled: false,
    beforeRegExp: "",
    after: "",
  },
  frontMatterKeyForExclusionInternalLink: "",

  // front matter complement
  enableFrontMatterComplement: true,
  frontMatterComplementMatchStrategy: "inherit",
  insertCommaAfterFrontMatterCompletion: false,

  intelligentSuggestionPrioritization: {
    historyFilePath: "",
    maxDaysToKeepHistory: 30,
    maxNumberOfHistoryToKeep: 0,
  },

  // mobile
  disableOnMobile: false,

  // debug
  showLogAboutPerformanceInConsole: false,

  // others
  // TODO: Want to remove in the future version
  selectionHistoryTree: {},
};

export class VariousComplementsSettingTab extends PluginSettingTab {
  plugin: VariousComponents;

  constructor(app: App, plugin: VariousComponents) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Various Complements - Settings" });
    await this.addMainSettings(containerEl);
    this.addAppearanceSettings(containerEl);
    this.addKeyCustomizationSettings(containerEl);
    this.addCurrentFileComplementSettings(containerEl);
    this.addCurrentVaultComplementSettings(containerEl);
    this.addCustomDictionaryComplementSettings(containerEl);
    this.addInternalLinkComplementSettings(containerEl);
    this.addFrontMatterComplementSettings(containerEl);
    this.addIntelligentSuggestionPrioritizationSettings(containerEl);
    this.addMobileSettings(containerEl);
    this.addDebugSettings(containerEl);
  }

  private async addMainSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", { text: "Main" });

    new Setting(containerEl).setName("Strategy").addDropdown((tc) =>
      tc
        .addOptions(mirrorMap(TokenizeStrategy.values(), (x) => x.name))
        .setValue(this.plugin.settings.strategy)
        .onChange(async (value) => {
          this.plugin.settings.strategy = value;
          this.display();
          await this.plugin.saveSettings({
            currentFile: true,
            currentVault: true,
          });
        })
    );
    if (this.plugin.settings.strategy === TokenizeStrategy.CHINESE.name) {
      const el = containerEl.createEl("div", {
        cls: "various-complements__settings__warning",
      });

      const df = document.createDocumentFragment();
      df.append(
        createSpan({
          text: "The path to `cedict_ts.u8`. You can download it from ",
        }),
        createEl("a", {
          href: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
          text: " the site ",
        })
      );

      new Setting(containerEl)
        .setName("CC-CEDICT path")
        .setDesc(df)
        .setClass("various-complements__settings__nested")
        .addText((cb) => {
          TextComponentEvent.onChange(cb, async (value) => {
            this.plugin.settings.cedictPath = value;
            await this.plugin.saveSettings();
            await this.display();
          }).setValue(this.plugin.settings.cedictPath);
        });

      const hasCedict = await app.vault.adapter.exists(
        this.plugin.settings.cedictPath
      );
      if (!hasCedict) {
        containerEl.createEl("div", {
          text: `⚠ cedict_ts.u8 doesn't exist in ${this.plugin.settings.cedictPath}.`,
          cls: "various-complements__settings__warning",
        });
      }
    }

    new Setting(containerEl).setName("Match strategy").addDropdown((tc) =>
      tc
        .addOptions(mirrorMap(MatchStrategy.values(), (x) => x.name))
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

    new Setting(containerEl).setName("Fuzzy match").addToggle((tc) => {
      tc.setValue(this.plugin.settings.fuzzyMatch).onChange(async (value) => {
        this.plugin.settings.fuzzyMatch = value;
        await this.plugin.saveSettings();
      });
    });

    new Setting(containerEl)
      .setName("Treat accent diacritics as alphabetic characters.")
      .setDesc("Ex: If enabled, 'aaa' matches with 'áäā'")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.treatAccentDiacriticsAsAlphabeticCharacters
        ).onChange(async (value) => {
          this.plugin.settings.treatAccentDiacriticsAsAlphabeticCharacters =
            value;
          await this.plugin.saveSettings({
            internalLink: true,
            customDictionary: true,
            currentVault: true,
            currentFile: true,
          });
        });
      });

    new Setting(containerEl)
      .setName("Matching without emoji")
      .setDesc("Ex: If enabled, 'aaa' matches with '😀aaa'")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.matchingWithoutEmoji).onChange(
          async (value) => {
            this.plugin.settings.matchingWithoutEmoji = value;
            await this.plugin.saveSettings({
              internalLink: true,
              customDictionary: true,
              currentVault: true,
              currentFile: true,
            });
          }
        );
      });

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

    new Setting(containerEl)
      .setName("First characters to disable suggestions")
      .addText((cb) => {
        cb.setValue(
          this.plugin.settings.firstCharactersDisableSuggestions
        ).onChange(async (value) => {
          this.plugin.settings.firstCharactersDisableSuggestions = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("(Experimental) Use common prefix completion of suggestion")
      .setDesc("Hotkey is <TAB>")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.useCommonPrefixCompletionOfSuggestion
        ).onChange(async (value) => {
          this.plugin.settings.useCommonPrefixCompletionOfSuggestion = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Patterns to suppress trigger")
      .setDesc(
        "RegExp line patterns until the cursor, which suppresses the auto-completion trigger. It can set multi patterns by line breaks."
      )
      .addTextArea((tc) =>
        tc
          .setValue(this.plugin.settings.patternsToSuppressTrigger.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.patternsToSuppressTrigger =
              smartLineBreakSplit(value);
            await this.plugin.saveSettings();
          })
      );
  }

  private addAppearanceSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", { text: "Appearance" });

    new Setting(containerEl)
      .setName("Show Match strategy")
      .setDesc(
        "Show Match strategy at the status bar. Changing this option requires a restart to take effect."
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showMatchStrategy).onChange(
          async (value) => {
            this.plugin.settings.showMatchStrategy = value;
            await this.plugin.saveSettings();
          }
        );
      });

    new Setting(containerEl)
      .setName("Show Complement automatically")
      .setDesc(
        "Show complement automatically at the status bar. Changing this option requires a restart to take effect."
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showComplementAutomatically).onChange(
          async (value) => {
            this.plugin.settings.showComplementAutomatically = value;
            await this.plugin.saveSettings();
          }
        );
      });

    new Setting(containerEl)
      .setName("Show Indexing status")
      .setDesc(
        "Show indexing status at the status bar. Changing this option requires a restart to take effect."
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showIndexingStatus).onChange(
          async (value) => {
            this.plugin.settings.showIndexingStatus = value;
            await this.plugin.saveSettings();
          }
        );
      });

    new Setting(containerEl)
      .setName("Description on a suggestion")
      .addDropdown((tc) =>
        tc
          .addOptions(
            mirrorMap(DescriptionOnSuggestion.values(), (x) => x.name)
          )
          .setValue(this.plugin.settings.descriptionOnSuggestion)
          .onChange(async (value) => {
            this.plugin.settings.descriptionOnSuggestion = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private addKeyCustomizationSettings(containerEl: HTMLElement) {
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
            mirrorMap(CycleThroughSuggestionsKeys.values(), (x) => x.name)
          )
          .setValue(this.plugin.settings.additionalCycleThroughSuggestionsKeys)
          .onChange(async (value) => {
            this.plugin.settings.additionalCycleThroughSuggestionsKeys = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Disable the up/down keys for cycle through suggestions keys")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.disableUpDownKeysForCycleThroughSuggestionsKeys
        ).onChange(async (value) => {
          this.plugin.settings.disableUpDownKeysForCycleThroughSuggestionsKeys =
            value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName("Open source file key").addDropdown((tc) =>
      tc
        .addOptions(mirrorMap(OpenSourceFileKeys.values(), (x) => x.name))
        .setValue(this.plugin.settings.openSourceFileKey)
        .onChange(async (value) => {
          this.plugin.settings.openSourceFileKey = value;
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
  }

  private addCurrentFileComplementSettings(containerEl: HTMLElement) {
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
        .setName("Min number of characters for indexing")
        .setDesc("It uses a default value of Strategy if set 0.")
        .addSlider((sc) =>
          sc
            .setLimits(0, 15, 1)
            .setValue(this.plugin.settings.currentFileMinNumberOfCharacters)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.currentFileMinNumberOfCharacters = value;
              await this.plugin.saveSettings({ currentFile: true });
            })
        );

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
  }

  private addCurrentVaultComplementSettings(containerEl: HTMLElement) {
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
            this.display();
            await this.plugin.saveSettings({ currentVault: true });
          }
        );
      });

    if (this.plugin.settings.enableCurrentVaultComplement) {
      new Setting(containerEl)
        .setName("Min number of characters for indexing")
        .setDesc("It uses a default value of Strategy if set 0.")
        .addSlider((sc) =>
          sc
            .setLimits(0, 15, 1)
            .setValue(this.plugin.settings.currentVaultMinNumberOfCharacters)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.currentVaultMinNumberOfCharacters = value;
              await this.plugin.saveSettings();
            })
        );

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
      new Setting(containerEl)
        .setName("Include only files under current directory")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings
              .includeCurrentVaultOnlyFilesUnderCurrentDirectory
          ).onChange(async (value) => {
            this.plugin.settings.includeCurrentVaultOnlyFilesUnderCurrentDirectory =
              value;
            await this.plugin.saveSettings();
          });
        });
    }
  }

  private addCustomDictionaryComplementSettings(containerEl: HTMLElement) {
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
          .addOptions(mirrorMap(ColumnDelimiter.values(), (x) => x.name))
          .setValue(this.plugin.settings.columnDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.columnDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

      new Setting(containerEl)
        .setName("Word regex pattern")
        .setDesc("Only load words that match the regular expression pattern.")
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings.customDictionaryWordRegexPattern
          ).onChange(async (value) => {
            this.plugin.settings.customDictionaryWordRegexPattern = value;
            await this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Delimiter to hide a suggestion")
        .setDesc(
          "If set ';;;', 'abcd;;;efg' is shown as 'abcd' on suggestions, but completes to 'abcdefg'."
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
        .setName(
          "Delimiter to divide suggestions for display from ones for insertion"
        )
        .setDesc(
          "If set ' >>> ', 'displayed >>> inserted' is shown as 'displayed' on suggestions, but completes to 'inserted'."
        )
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings
              .delimiterToDivideSuggestionsForDisplayFromInsertion
          ).onChange(async (value) => {
            this.plugin.settings.delimiterToDivideSuggestionsForDisplayFromInsertion =
              value;
            await this.plugin.saveSettings();
          });
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

      new Setting(containerEl)
        .setName("Displayed text suffix")
        .setDesc(
          "It shows as a suffix of displayed text if there is a difference between displayed and inserted"
        )
        .addText((cb) => {
          cb.setValue(this.plugin.settings.displayedTextSuffix).onChange(
            async (value) => {
              this.plugin.settings.displayedTextSuffix = value;
              await this.plugin.saveSettings();
            }
          );
        });
    }
  }

  private addInternalLinkComplementSettings(containerEl: HTMLElement) {
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
      new Setting(containerEl)
        .setName("Update internal links on save")
        .addToggle((tc) => {
          tc.setValue(this.plugin.settings.updateInternalLinksOnSave).onChange(
            async (value) => {
              this.plugin.settings.updateInternalLinksOnSave = value;
              await this.plugin.saveSettings({ internalLink: true });
            }
          );
        });

      new Setting(containerEl)
        .setName(
          "Insert an alias that is transformed from the displayed internal link"
        )
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink
              .enabled
          ).onChange(async (value) => {
            this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink.enabled =
              value;
            await this.plugin.saveSettings();
            this.display();
          });
        });

      if (
        this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink
          .enabled
      ) {
        new Setting(containerEl)
          .setName("Before: regular expression pattern with captures")
          .setDesc(String.raw`Ex: (?<name>.+) \(.+\)$`)
          .setClass("various-complements__settings__nested")
          .addText((cb) => {
            cb.setValue(
              this.plugin.settings
                .insertAliasTransformedFromDisplayedInternalLink.beforeRegExp
            ).onChange(async (value) => {
              this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink.beforeRegExp =
                value;
              await this.plugin.saveSettings();
            });
          });
        new Setting(containerEl)
          .setName("After")
          .setDesc("Ex: $<name>")
          .setClass("various-complements__settings__nested")
          .addText((cb) => {
            cb.setValue(
              this.plugin.settings
                .insertAliasTransformedFromDisplayedInternalLink.after
            ).onChange(async (value) => {
              this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink.after =
                value;
              await this.plugin.saveSettings();
            });
          });
      }

      new Setting(containerEl)
        .setName("Exclude prefix path patterns")
        .setDesc("Prefix match path patterns to exclude files.")
        .addTextArea((tac) => {
          const el = tac
            .setValue(
              this.plugin.settings.excludeInternalLinkPathPrefixPatterns
            )
            .setPlaceholder("Private/")
            .onChange(async (value) => {
              this.plugin.settings.excludeInternalLinkPathPrefixPatterns =
                value;
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path";
          return el;
        });

      new Setting(containerEl)
        .setName("Front matter key for exclusion")
        .setDesc(
          "Exclude internal links from the suggestions if whose front matters have the key whose name is same as this setting, and the value is 'true'"
        )
        .addText((cb) => {
          TextComponentEvent.onChange(cb, async (value) => {
            this.plugin.settings.frontMatterKeyForExclusionInternalLink = value;
            await this.plugin.saveSettings({ internalLink: true });
          }).setValue(
            this.plugin.settings.frontMatterKeyForExclusionInternalLink
          );
        });
    }
  }

  private addFrontMatterComplementSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Front matter complement",
      cls: "various-complements__settings__header various-complements__settings__header__front-matter",
    });

    new Setting(containerEl)
      .setName("Enable Front matter complement")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.enableFrontMatterComplement).onChange(
          async (value) => {
            this.plugin.settings.enableFrontMatterComplement = value;
            await this.plugin.saveSettings({ frontMatter: true });
            this.display();
          }
        );
      });

    if (this.plugin.settings.enableFrontMatterComplement) {
      new Setting(containerEl)
        .setName("Match strategy in the front matter")
        .addDropdown((tc) =>
          tc
            .addOptions(
              mirrorMap(SpecificMatchStrategy.values(), (x) => x.name)
            )
            .setValue(this.plugin.settings.frontMatterComplementMatchStrategy)
            .onChange(async (value) => {
              this.plugin.settings.frontMatterComplementMatchStrategy = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Insert comma after completion")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.insertCommaAfterFrontMatterCompletion
          ).onChange(async (value) => {
            this.plugin.settings.insertCommaAfterFrontMatterCompletion = value;
            await this.plugin.saveSettings();
          });
        });
    }
  }

  private addIntelligentSuggestionPrioritizationSettings(
    containerEl: HTMLElement
  ) {
    containerEl.createEl("h3", {
      text: "Intelligent suggestion prioritization",
      cls: "various-complements__settings__header various-complements__settings__header__intelligent-suggestion-prioritization",
    });

    new Setting(containerEl)
      .setName("history file path")
      .setDesc(`Default: ${DEFAULT_HISTORIES_PATH}`)
      .addText((cb) => {
        TextComponentEvent.onChange(cb, async (value) => {
          this.plugin.settings.intelligentSuggestionPrioritization.historyFilePath =
            value;
          await this.plugin.saveSettings();
        }).setValue(
          this.plugin.settings.intelligentSuggestionPrioritization
            .historyFilePath
        );
      });

    new Setting(containerEl)
      .setName("Max days to keep history")
      .setDesc("If set 0, it will never remove")
      .addSlider((sc) =>
        sc
          .setLimits(0, 365, 1)
          .setValue(
            this.plugin.settings.intelligentSuggestionPrioritization
              .maxDaysToKeepHistory
          )
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.intelligentSuggestionPrioritization.maxDaysToKeepHistory =
              value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max number of history to keep")
      .setDesc("If set 0, it will never remove")
      .addSlider((sc) =>
        sc
          .setLimits(0, 10000, 1)
          .setValue(
            this.plugin.settings.intelligentSuggestionPrioritization
              .maxNumberOfHistoryToKeep
          )
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.intelligentSuggestionPrioritization.maxNumberOfHistoryToKeep =
              value;
            await this.plugin.saveSettings();
          })
      );
  }

  private addMobileSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", { text: "Mobile" });

    new Setting(containerEl).setName("Disable on mobile").addToggle((tc) => {
      tc.setValue(this.plugin.settings.disableOnMobile).onChange(
        async (value) => {
          this.plugin.settings.disableOnMobile = value;
          await this.plugin.saveSettings();
        }
      );
    });
  }

  private addDebugSettings(containerEl: HTMLElement) {
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

  async ensureCustomDictionaryPath(
    path: string,
    state: "present" | "absent"
  ): Promise<boolean> {
    const paths = this.plugin.settings.customDictionaryPaths.split("\n");
    const exists = paths.some((x) => x === path);
    if ((exists && state === "present") || (!exists && state === "absent")) {
      return false;
    }

    const newPaths =
      state === "present" ? [...paths, path] : paths.filter((x) => x !== path);
    this.plugin.settings.customDictionaryPaths = newPaths.join("\n");
    await this.plugin.saveSettings({ customDictionary: true });

    return true;
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
