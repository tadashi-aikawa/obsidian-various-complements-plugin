import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type { Hotkey } from "../keys";
import { hotkey2String, string2Hotkey } from "../keys";
import type VariousComponents from "../main";
import { ColumnDelimiter } from "../option/ColumnDelimiter";
import { DescriptionOnSuggestion } from "../option/DescriptionOnSuggestion";
import { MatchStrategy } from "../provider/MatchStrategy";
import { SpecificMatchStrategy } from "../provider/SpecificMatchStrategy";
import { TokenizeStrategy } from "../tokenizer/TokenizeStrategy";
import { isPresent } from "../types";
import { mirrorMap } from "../util/collection-helper";
import { DEFAULT_HISTORIES_PATH } from "../util/path";
import { smartLineBreakSplit } from "../util/strings";
import { TextComponentEvent } from "./settings-helper";

export interface Settings {
  // general
  strategy: string;
  cedictPath: string;
  matchStrategy: string;
  fuzzyMatch: boolean;
  minFuzzyMatchScore: number;
  matchingWithoutEmoji: boolean;
  treatAccentDiacriticsAsAlphabeticCharacters: boolean;
  treatUnderscoreAsPartOfWord: boolean;
  maxNumberOfSuggestions: number;
  maxNumberOfWordsAsPhrase: number;
  minNumberOfCharactersTriggered: number;
  minNumberOfWordsTriggeredPhrase: number;
  complementAutomatically: boolean;
  delayMilliSeconds: number;
  disableSuggestionsDuringImeOn: boolean;
  disableSuggestionsInMathBlock: boolean;
  // XXX: Want to rename at next major version up
  insertSpaceAfterCompletion: boolean;
  firstCharactersDisableSuggestions: string;
  patternsToSuppressTrigger: string[];
  phrasePatternsToSuppressTrigger: string[];
  noAutoFocusUntilCycle: boolean;

  // appearance
  showMatchStrategy: boolean;
  showComplementAutomatically: boolean;
  showIndexingStatus: boolean;
  descriptionOnSuggestion: string;

  // key customization
  hotkeys: {
    select: Hotkey[];
    "select with custom alias": Hotkey[];
    "select with query alias": Hotkey[];
    up: Hotkey[];
    down: Hotkey[];
    "select 1st": Hotkey[];
    "select 2nd": Hotkey[];
    "select 3rd": Hotkey[];
    "select 4th": Hotkey[];
    "select 5th": Hotkey[];
    "select 6th": Hotkey[];
    "select 7th": Hotkey[];
    "select 8th": Hotkey[];
    "select 9th": Hotkey[];
    open: Hotkey[];
    completion: Hotkey[];
    "insert as text": Hotkey[];
  };
  propagateEsc: boolean;

  // current file complement
  enableCurrentFileComplement: boolean;
  currentFileMinNumberOfCharacters: number;
  onlyComplementEnglishOnCurrentFileComplement: boolean;
  excludeCurrentFileWordPatterns: string[];

  // current vault complement
  enableCurrentVaultComplement: boolean;
  currentVaultMinNumberOfCharacters: number;
  includeCurrentVaultPathPrefixPatterns: string;
  excludeCurrentVaultPathPrefixPatterns: string;
  includeCurrentVaultOnlyFilesUnderCurrentDirectory: boolean;
  excludeCurrentVaultWordPatterns: string[];

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
  excludeSelfInternalLink: boolean;
  excludeExistingInActiveFileInternalLinks: boolean;

  updateInternalLinksOnSave: boolean;
  insertAliasTransformedFromDisplayedInternalLink: {
    enabled: boolean;
    beforeRegExp: string;
    after: string;
  };
  frontMatterKeyForExclusionInternalLink: string;
  tagsForExclusionInternalLink: string[];

  // front matter complement
  enableFrontMatterComplement: boolean;
  frontMatterComplementMatchStrategy: string;
  insertCommaAfterFrontMatterCompletion: boolean;

  intelligentSuggestionPrioritization: {
    enabled: boolean;
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
}

export const DEFAULT_SETTINGS: Settings = {
  // general
  strategy: "default",
  cedictPath: "./cedict_ts.u8",
  matchStrategy: "prefix",
  fuzzyMatch: true,
  minFuzzyMatchScore: 0.5,
  matchingWithoutEmoji: true,
  treatAccentDiacriticsAsAlphabeticCharacters: false,
  treatUnderscoreAsPartOfWord: false,

  maxNumberOfSuggestions: 5,
  maxNumberOfWordsAsPhrase: 3,
  minNumberOfCharactersTriggered: 0,
  minNumberOfWordsTriggeredPhrase: 1,
  complementAutomatically: true,
  delayMilliSeconds: 0,
  disableSuggestionsDuringImeOn: false,
  disableSuggestionsInMathBlock: false,
  insertSpaceAfterCompletion: false,
  firstCharactersDisableSuggestions: ":/^",
  patternsToSuppressTrigger: ["^~~~.*", "^```.*"],
  phrasePatternsToSuppressTrigger: [],
  noAutoFocusUntilCycle: false,

  // appearance
  showMatchStrategy: false,
  showComplementAutomatically: false,
  showIndexingStatus: false,
  descriptionOnSuggestion: "Short",

  // key customization
  hotkeys: {
    select: [{ modifiers: [], key: "Enter" }],
    "select with custom alias": [],
    "select with query alias": [],
    up: [{ modifiers: [], key: "ArrowUp" }],
    down: [{ modifiers: [], key: "ArrowDown" }],
    "select 1st": [],
    "select 2nd": [],
    "select 3rd": [],
    "select 4th": [],
    "select 5th": [],
    "select 6th": [],
    "select 7th": [],
    "select 8th": [],
    "select 9th": [],
    open: [],
    completion: [],
    "insert as text": [],
  },
  propagateEsc: false,

  // current file complement
  enableCurrentFileComplement: true,
  currentFileMinNumberOfCharacters: 0,
  onlyComplementEnglishOnCurrentFileComplement: false,
  excludeCurrentFileWordPatterns: [],

  // current vault complement
  enableCurrentVaultComplement: false,
  currentVaultMinNumberOfCharacters: 0,
  includeCurrentVaultPathPrefixPatterns: "",
  excludeCurrentVaultPathPrefixPatterns: "",
  includeCurrentVaultOnlyFilesUnderCurrentDirectory: false,
  excludeCurrentVaultWordPatterns: [],

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
  excludeSelfInternalLink: false,
  excludeExistingInActiveFileInternalLinks: false,
  updateInternalLinksOnSave: true,
  insertAliasTransformedFromDisplayedInternalLink: {
    enabled: false,
    beforeRegExp: "",
    after: "",
  },
  frontMatterKeyForExclusionInternalLink: "",
  tagsForExclusionInternalLink: [],

  // front matter complement
  enableFrontMatterComplement: false,
  frontMatterComplementMatchStrategy: "inherit",
  insertCommaAfterFrontMatterCompletion: false,

  intelligentSuggestionPrioritization: {
    enabled: true,
    historyFilePath: "",
    maxDaysToKeepHistory: 30,
    maxNumberOfHistoryToKeep: 0,
  },

  // mobile
  disableOnMobile: false,

  // debug
  showLogAboutPerformanceInConsole: false,
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
    containerEl.createEl("h3", {
      text: "Main",
      cls: "various-complements__settings__header various-complements__settings__header__main",
    });

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
        }),
    );
    if (this.plugin.settings.strategy === TokenizeStrategy.CHINESE.name) {
      const df = document.createDocumentFragment();
      df.append(
        createSpan({
          text: "The path to `cedict_ts.u8`. You can download it from ",
        }),
        createEl("a", {
          href: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
          text: " the site ",
        }),
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
        this.plugin.settings.cedictPath,
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
        }),
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
      .setName("Min fuzzy match score")
      .setDesc(
        "It only shows suggestions whose fuzzy matched score is more than the specific value.",
      )
      .addSlider((sc) =>
        sc
          .setLimits(0, 5.0, 0.1)
          .setValue(this.plugin.settings.minFuzzyMatchScore)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minFuzzyMatchScore = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Treat accent diacritics as alphabetic characters.")
      .setDesc("Ex: If enabled, 'aaa' matches with 'áäā'")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.treatAccentDiacriticsAsAlphabeticCharacters,
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

    if (
      TokenizeStrategy.fromName(this.plugin.settings.strategy)
        .canTreatUnderscoreAsPartOfWord
    ) {
      new Setting(containerEl)
        .setName("Treat an underscore as a part of a word.")
        .setDesc(
          "If this setting is enabled, aaa_bbb will be tokenized as a single token aaa_bbb, rather than being split into aaa and bbb.",
        )
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.treatUnderscoreAsPartOfWord,
          ).onChange(async (value) => {
            this.plugin.settings.treatUnderscoreAsPartOfWord = value;
            await this.plugin.saveSettings({
              internalLink: true,
              customDictionary: true,
              currentVault: true,
              currentFile: true,
            });
          });
        });
    }

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
          },
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
          }),
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
          }),
      );

    new Setting(containerEl)
      .setName("Min number of characters for trigger")
      .setDesc(
        "Setting the value to 0 does not mean the suggestion will be triggered without any inputted character. Instead, a designated value will be used depending on the Strategy you choose.",
      )
      .addSlider((sc) =>
        sc
          .setLimits(0, 10, 1)
          .setValue(this.plugin.settings.minNumberOfCharactersTriggered)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.minNumberOfCharactersTriggered = value;
            await this.plugin.saveSettings();
          }),
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
          }),
      );

    new Setting(containerEl)
      .setName("Complement automatically")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.complementAutomatically).onChange(
          async (value) => {
            this.plugin.settings.complementAutomatically = value;
            await this.plugin.saveSettings();
          },
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
          }),
      );

    new Setting(containerEl)
      .setName("Disable suggestions during IME on")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.disableSuggestionsDuringImeOn,
        ).onChange(async (value) => {
          this.plugin.settings.disableSuggestionsDuringImeOn = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Disable suggestions in the Math block")
      .setDesc("It doesn't support the inline Math block.")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.disableSuggestionsInMathBlock,
        ).onChange(async (value) => {
          this.plugin.settings.disableSuggestionsInMathBlock = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Insert space after completion")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.insertSpaceAfterCompletion).onChange(
          async (value) => {
            this.plugin.settings.insertSpaceAfterCompletion = value;
            await this.plugin.saveSettings();
          },
        );
      });

    new Setting(containerEl)
      .setName("First characters to disable suggestions")
      .addText((cb) => {
        cb.setValue(
          this.plugin.settings.firstCharactersDisableSuggestions,
        ).onChange(async (value) => {
          this.plugin.settings.firstCharactersDisableSuggestions = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Line patterns to suppress trigger")
      .setDesc(
        "Regular expression line patterns (partial match) until the cursor, that suppresses the activation of autocomplete. Multiple patterns can be defined with line breaks.",
      )
      .addTextArea((tc) => {
        const el = tc
          .setValue(this.plugin.settings.patternsToSuppressTrigger.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.patternsToSuppressTrigger =
              smartLineBreakSplit(value);
            await this.plugin.saveSettings();
          });
        el.inputEl.className =
          "various-complements__settings__text-area-path-dense";
        return el;
      });

    new Setting(containerEl)
      .setName("Phrase patterns to suppress trigger")
      .setDesc(
        "Regular expression patterns (exact match) that suppress the activation of autocomplete. Multiple patterns can be defined with line breaks.",
      )
      .addTextArea((tc) => {
        const el = tc
          .setValue(
            this.plugin.settings.phrasePatternsToSuppressTrigger.join("\n"),
          )
          .onChange(async (value) => {
            this.plugin.settings.phrasePatternsToSuppressTrigger =
              smartLineBreakSplit(value);
            await this.plugin.saveSettings();
          });
        el.inputEl.className =
          "various-complements__settings__text-area-path-dense";
        return el;
      });

    new Setting(containerEl)
      .setName("No auto-focus until the cycle")
      .setDesc("No focus on the suggestions until the cycle key is pressed.")
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.noAutoFocusUntilCycle).onChange(
          async (value) => {
            this.plugin.settings.noAutoFocusUntilCycle = value;
            await this.plugin.saveSettings();
          },
        );
      });
  }

  private addAppearanceSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Appearance",
      cls: "various-complements__settings__header various-complements__settings__header__appearance",
    });

    new Setting(containerEl)
      .setName("Show Match strategy")
      .setDesc(
        "Show Match strategy at the status bar. Changing this option requires a restart to take effect.",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showMatchStrategy).onChange(
          async (value) => {
            this.plugin.settings.showMatchStrategy = value;
            await this.plugin.saveSettings();
          },
        );
      });

    new Setting(containerEl)
      .setName("Show Complement automatically")
      .setDesc(
        "Show complement automatically at the status bar. Changing this option requires a restart to take effect.",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showComplementAutomatically).onChange(
          async (value) => {
            this.plugin.settings.showComplementAutomatically = value;
            await this.plugin.saveSettings();
          },
        );
      });

    new Setting(containerEl)
      .setName("Show Indexing status")
      .setDesc(
        "Show indexing status at the status bar. Changing this option requires a restart to take effect.",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.showIndexingStatus).onChange(
          async (value) => {
            this.plugin.settings.showIndexingStatus = value;
            await this.plugin.saveSettings();
          },
        );
      });

    new Setting(containerEl)
      .setName("Description on a suggestion")
      .addDropdown((tc) =>
        tc
          .addOptions(
            mirrorMap(DescriptionOnSuggestion.values(), (x) => x.name),
          )
          .setValue(this.plugin.settings.descriptionOnSuggestion)
          .onChange(async (value) => {
            this.plugin.settings.descriptionOnSuggestion = value;
            await this.plugin.saveSettings();
          }),
      );
  }

  private addKeyCustomizationSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Key customization",
      cls: "various-complements__settings__header various-complements__settings__header__key-customization",
    });

    const div = createDiv({
      cls: "various-complements__settings__popup-hotkey",
    });
    containerEl.append(div);

    const li = createEl("li");
    li.append(
      "You can find the keycode at ",
      createEl("a", {
        text: "keycode.info",
        href: "https://keycode.info/",
      }),
      ". Press any key to see the '",
      createEl("code", {
        text: "event.key",
      }),
      "' value, ",
      createEl("b", {
        text: "except for the space key",
      }),
      ". Set the space key as '",
      createEl("code", {
        text: "Space",
      }),
      "'.",
    );

    const ul = createEl("ul");
    ul.createEl("li", {
      text: "'Ctrl a' means pressing the Ctrl key and the A key.",
    });
    ul.createEl("li", {
      text: "'Enter|Tab' means pressing the Enter key or the Tab key.",
    });
    ul.createEl("li", {
      text: "Use 'Mod' instead of 'Ctrl' on Windows or 'Cmd' on macOS.",
    });
    ul.append(li);

    const df = document.createDocumentFragment();
    df.append(ul);

    new Setting(div).setHeading().setName("Hotkeys").setDesc(df);

    const hotkeys = this.plugin.settings.hotkeys;
    Object.keys(hotkeys).forEach((k: string) => {
      const key = k as keyof Settings["hotkeys"];

      new Setting(div)
        .setName(key)
        .setClass("various-complements__settings__popup-hotkey-item")
        .addText((cb) => {
          return cb
            .setValue(hotkeys[key].map(hotkey2String).join("|"))
            .onChange(async (value: string) => {
              hotkeys[key] = value
                .split("|")
                .map((x) => string2Hotkey(x, false))
                .filter(isPresent);
              await this.plugin.saveSettings();
            });
        });
    });

    new Setting(containerEl)
      .setName("Propagate ESC")
      .setDesc(
        "It is handy if you use Vim mode because you can switch to Normal mode by one ESC, whether it shows suggestions or not.",
      )
      .addToggle((tc) => {
        tc.setValue(this.plugin.settings.propagateEsc).onChange(
          async (value) => {
            this.plugin.settings.propagateEsc = value;
            await this.plugin.saveSettings();
          },
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
          },
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
            }),
        );

      new Setting(containerEl)
        .setName("Only complement English on current file complement")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.onlyComplementEnglishOnCurrentFileComplement,
          ).onChange(async (value) => {
            this.plugin.settings.onlyComplementEnglishOnCurrentFileComplement =
              value;
            await this.plugin.saveSettings({ currentFile: true });
          });
        });

      new Setting(containerEl)
        .setName("Exclude word patterns for indexing")
        .setDesc(
          "Regexp patterns for words to be excluded from the suggestions, separated by line breaks.",
        )
        .addTextArea((tc) => {
          const el = tc
            .setValue(
              this.plugin.settings.excludeCurrentFileWordPatterns.join("\n"),
            )
            .onChange(async (value) => {
              this.plugin.settings.excludeCurrentFileWordPatterns =
                smartLineBreakSplit(value);
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path-dense";
          return el;
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
          },
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
            }),
        );

      new Setting(containerEl)
        .setName("Include prefix path patterns")
        .setDesc("Prefix match path patterns to include files.")
        .addTextArea((tac) => {
          const el = tac
            .setValue(
              this.plugin.settings.includeCurrentVaultPathPrefixPatterns,
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
              this.plugin.settings.excludeCurrentVaultPathPrefixPatterns,
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
              .includeCurrentVaultOnlyFilesUnderCurrentDirectory,
          ).onChange(async (value) => {
            this.plugin.settings.includeCurrentVaultOnlyFilesUnderCurrentDirectory =
              value;
            await this.plugin.saveSettings();
          });
        });
      new Setting(containerEl)
        .setName("Exclude word patterns for indexing")
        .setDesc(
          "Regexp patterns for words to be excluded from the suggestions, separated by line breaks.",
        )
        .addTextArea((tc) => {
          const el = tc
            .setValue(
              this.plugin.settings.excludeCurrentVaultWordPatterns.join("\n"),
            )
            .onChange(async (value) => {
              this.plugin.settings.excludeCurrentVaultWordPatterns =
                smartLineBreakSplit(value);
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path-dense";
          return el;
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
          this.plugin.settings.enableCustomDictionaryComplement,
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
          "Specify either a relative path from Vault root or URL for each line.",
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
          }),
      );

      new Setting(containerEl)
        .setName("Word regex pattern")
        .setDesc("Only load words that match the regular expression pattern.")
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings.customDictionaryWordRegexPattern,
          ).onChange(async (value) => {
            this.plugin.settings.customDictionaryWordRegexPattern = value;
            await this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Delimiter to hide a suggestion")
        .setDesc(
          "If set ';;;', 'abcd;;;efg' is shown as 'abcd' on suggestions, but completes to 'abcdefg'.",
        )
        .addText((cb) => {
          cb.setValue(this.plugin.settings.delimiterToHideSuggestion).onChange(
            async (value) => {
              this.plugin.settings.delimiterToHideSuggestion = value;
              await this.plugin.saveSettings();
            },
          );
        });

      new Setting(containerEl)
        .setName(
          "Delimiter to divide suggestions for display from ones for insertion",
        )
        .setDesc(
          "If set ' >>> ', 'displayed >>> inserted' is shown as 'displayed' on suggestions, but completes to 'inserted'.",
        )
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings
              .delimiterToDivideSuggestionsForDisplayFromInsertion,
          ).onChange(async (value) => {
            this.plugin.settings.delimiterToDivideSuggestionsForDisplayFromInsertion =
              value;
            await this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Caret location symbol after complement")
        .setDesc(
          "If set '<CARET>' and there is '<li><CARET></li>' in custom dictionary, it complements '<li></li>' and move a caret where between '<li>' and `</li>`.",
        )
        .addText((cb) => {
          cb.setValue(
            this.plugin.settings.caretLocationSymbolAfterComplement,
          ).onChange(async (value) => {
            this.plugin.settings.caretLocationSymbolAfterComplement = value;
            await this.plugin.saveSettings();
          });
        });

      new Setting(containerEl)
        .setName("Displayed text suffix")
        .setDesc(
          "It shows as a suffix of displayed text if there is a difference between displayed and inserted",
        )
        .addText((cb) => {
          cb.setValue(this.plugin.settings.displayedTextSuffix).onChange(
            async (value) => {
              this.plugin.settings.displayedTextSuffix = value;
              await this.plugin.saveSettings();
            },
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
          },
        );
      });

    if (this.plugin.settings.enableInternalLinkComplement) {
      new Setting(containerEl)
        .setName("Suggest with an alias")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.suggestInternalLinkWithAlias,
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
            },
          );
        });
      new Setting(containerEl)
        .setName("Exclude self internal link")
        .addToggle((tc) => {
          tc.setValue(this.plugin.settings.excludeSelfInternalLink).onChange(
            async (value) => {
              this.plugin.settings.excludeSelfInternalLink = value;
              await this.plugin.saveSettings({ internalLink: true });
            },
          );
        });
      new Setting(containerEl)
        .setName("Exclude existing in active file internal links")
        .setDesc(
          "Exclude internal links present in the current file from the suggestions. Note that the number of excluded suggestions will reduce the total suggestions by the value set in the 'Max number of suggestions' option.",
        )
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.excludeExistingInActiveFileInternalLinks,
          ).onChange(async (value) => {
            this.plugin.settings.excludeExistingInActiveFileInternalLinks =
              value;
            await this.plugin.saveSettings({ internalLink: true });
          });
        });

      new Setting(containerEl)
        .setName(
          "Insert an alias that is transformed from the displayed internal link",
        )
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.insertAliasTransformedFromDisplayedInternalLink
              .enabled,
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
                .insertAliasTransformedFromDisplayedInternalLink.beforeRegExp,
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
                .insertAliasTransformedFromDisplayedInternalLink.after,
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
              this.plugin.settings.excludeInternalLinkPathPrefixPatterns,
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
          "Exclude internal links from the suggestions if whose front matters have the key whose name is same as this setting, and the value is 'true'",
        )
        .addText((cb) => {
          TextComponentEvent.onChange(cb, async (value) => {
            this.plugin.settings.frontMatterKeyForExclusionInternalLink = value;
            await this.plugin.saveSettings({ internalLink: true });
          }).setValue(
            this.plugin.settings.frontMatterKeyForExclusionInternalLink,
          );
        });
      new Setting(containerEl)
        .setName("Tags for exclusion")
        .setDesc(
          "Tags to exclude suggestions for internal links. If specifying multiple tags, separate them with line breaks.",
        )
        .addTextArea((tc) => {
          const el = tc
            .setValue(
              this.plugin.settings.tagsForExclusionInternalLink.join("\n"),
            )
            .onChange(async (value) => {
              this.plugin.settings.tagsForExclusionInternalLink =
                smartLineBreakSplit(value);
              await this.plugin.saveSettings();
            });
          el.inputEl.className =
            "various-complements__settings__text-area-path-mini";
          return el;
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
          },
        );
      });

    if (this.plugin.settings.enableFrontMatterComplement) {
      new Setting(containerEl)
        .setName("Match strategy in the front matter")
        .addDropdown((tc) =>
          tc
            .addOptions(
              mirrorMap(SpecificMatchStrategy.values(), (x) => x.name),
            )
            .setValue(this.plugin.settings.frontMatterComplementMatchStrategy)
            .onChange(async (value) => {
              this.plugin.settings.frontMatterComplementMatchStrategy = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Insert comma after completion")
        .addToggle((tc) => {
          tc.setValue(
            this.plugin.settings.insertCommaAfterFrontMatterCompletion,
          ).onChange(async (value) => {
            this.plugin.settings.insertCommaAfterFrontMatterCompletion = value;
            await this.plugin.saveSettings();
          });
        });
    }
  }

  private addIntelligentSuggestionPrioritizationSettings(
    containerEl: HTMLElement,
  ) {
    containerEl.createEl("h3", {
      text: "Intelligent suggestion prioritization",
      cls: "various-complements__settings__header various-complements__settings__header__intelligent-suggestion-prioritization",
    });

    new Setting(containerEl)
      .setName("Enable Intelligent Suggestion Prioritization")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.intelligentSuggestionPrioritization.enabled,
        ).onChange(async (value) => {
          this.plugin.settings.intelligentSuggestionPrioritization.enabled =
            value;
          await this.plugin.saveSettings({
            intelligentSuggestionPrioritization: true,
          });
          this.display();
        });
      });

    if (this.plugin.settings.intelligentSuggestionPrioritization.enabled) {
      new Setting(containerEl)
        .setName("history file path")
        .setDesc(`Default: ${DEFAULT_HISTORIES_PATH}`)
        .addText((cb) => {
          TextComponentEvent.onChange(cb, async (value) => {
            this.plugin.settings.intelligentSuggestionPrioritization.historyFilePath =
              value;
            await this.plugin.saveSettings({
              intelligentSuggestionPrioritization: true,
            });
          }).setValue(
            this.plugin.settings.intelligentSuggestionPrioritization
              .historyFilePath,
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
                .maxDaysToKeepHistory,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.intelligentSuggestionPrioritization.maxDaysToKeepHistory =
                value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Max number of history to keep")
        .setDesc("If set 0, it will never remove")
        .addSlider((sc) =>
          sc
            .setLimits(0, 10000, 1)
            .setValue(
              this.plugin.settings.intelligentSuggestionPrioritization
                .maxNumberOfHistoryToKeep,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.intelligentSuggestionPrioritization.maxNumberOfHistoryToKeep =
                value;
              await this.plugin.saveSettings();
            }),
        );
    }
  }

  private addMobileSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Mobile",
      cls: "various-complements__settings__header various-complements__settings__header__mobile",
    });

    new Setting(containerEl).setName("Disable on mobile").addToggle((tc) => {
      tc.setValue(this.plugin.settings.disableOnMobile).onChange(
        async (value) => {
          this.plugin.settings.disableOnMobile = value;
          await this.plugin.saveSettings();
        },
      );
    });
  }

  private addDebugSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Debug",
      cls: "various-complements__settings__header various-complements__settings__header__debug",
    });

    new Setting(containerEl)
      .setName("Show log about performance in a console")
      .addToggle((tc) => {
        tc.setValue(
          this.plugin.settings.showLogAboutPerformanceInConsole,
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
    state: "present" | "absent",
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
      4,
    );
  }
}
