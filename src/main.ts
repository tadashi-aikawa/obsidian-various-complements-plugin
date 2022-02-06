import { Notice, Plugin } from "obsidian";
import { AutoCompleteSuggest } from "./ui/AutoCompleteSuggest";
import {
  DEFAULT_SETTINGS,
  Settings,
  VariousComplementsSettingTab,
} from "./settings";
import { CustomDictionaryWordRegisterModal } from "./ui/CustomDictionaryWordRegisterModal";
import { AppHelper } from "./app-helper";
import { ProviderStatusBar } from "./ui/ProviderStatusBar";

export default class VariousComponents extends Plugin {
  appHelper: AppHelper;
  settings: Settings;
  settingTab: VariousComplementsSettingTab;
  suggester: AutoCompleteSuggest;
  statusBar: ProviderStatusBar;

  onunload() {
    super.onunload();
    this.suggester.unregister();
  }

  async onload() {
    this.appHelper = new AppHelper(this.app);

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu) => {
        if (!this.appHelper.getSelection()) {
          return;
        }

        menu.addItem((item) =>
          item
            .setTitle("Add to custom dictionary")
            .setIcon("stacked-levels")
            .onClick(() => {
              this.addWordToCustomDictionary();
            })
        );
      })
    );

    await this.loadSettings();

    this.settingTab = new VariousComplementsSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.statusBar = ProviderStatusBar.new(this.addStatusBarItem());

    this.suggester = await AutoCompleteSuggest.new(
      this.app,
      this.settings,
      this.statusBar
    );
    this.registerEditorSuggest(this.suggester);

    this.addCommand({
      id: "reload-custom-dictionaries",
      name: "Reload custom dictionaries",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }],
      callback: async () => {
        await this.suggester.refreshCustomDictionaryTokens();
      },
    });

    this.addCommand({
      id: "reload-current-vault",
      name: "Reload current vault",
      callback: async () => {
        await this.suggester.refreshCurrentVaultTokens();
      },
    });

    this.addCommand({
      id: "toggle-match-strategy",
      name: "Toggle Match strategy",
      callback: async () => {
        await this.settingTab.toggleMatchStrategy();
      },
    });

    this.addCommand({
      id: "toggle-complement-automatically",
      name: "Toggle Complement automatically",
      callback: async () => {
        await this.settingTab.toggleComplementAutomatically();
      },
    });

    this.addCommand({
      id: "show-suggestions",
      name: "Show suggestions",
      hotkeys: [{ modifiers: ["Mod"], key: " " }],
      callback: async () => {
        this.suggester.triggerComplete();
      },
    });

    this.addCommand({
      id: "add-word-custom-dictionary",
      name: "Add a word to a custom dictionary",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: " " }],
      callback: async () => {
        this.addWordToCustomDictionary();
      },
    });

    this.addCommand({
      id: "predictable-complements",
      name: "Predictable complement",
      hotkeys: [{ modifiers: ["Shift"], key: " " }],
      callback: async () => {
        this.suggester.predictableComplete();
      },
    });

    this.addCommand({
      id: "copy-plugin-settings",
      name: "Copy plugin settings",
      callback: async () => {
        await navigator.clipboard.writeText(
          this.settingTab.getPluginSettingsAsJsonString()
        );
        // noinspection ObjectAllocationIgnored
        new Notice("Copy settings of Various Complements");
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(
    needUpdateTokens: {
      currentFile?: boolean;
      currentVault?: boolean;
      customDictionary?: boolean;
      internalLink?: boolean;
    } = {}
  ): Promise<void> {
    await this.saveData(this.settings);
    await this.suggester.updateSettings(this.settings);
    if (needUpdateTokens.currentFile) {
      await this.suggester.refreshCurrentFileTokens();
    }
    if (needUpdateTokens.currentVault) {
      await this.suggester.refreshCurrentVaultTokens();
    }
    if (needUpdateTokens.customDictionary) {
      await this.suggester.refreshCustomDictionaryTokens();
    }
    if (needUpdateTokens.internalLink) {
      await this.suggester.refreshInternalLinkTokens();
    }
  }

  addWordToCustomDictionary() {
    const selectedWord = this.appHelper.getSelection();
    const provider = this.suggester.customDictionaryWordProvider;
    const modal = new CustomDictionaryWordRegisterModal(
      this.app,
      provider.editablePaths,
      selectedWord,
      async (dictionaryPath, word) => {
        if (provider.wordByValue[word.value]) {
          // noinspection ObjectAllocationIgnored
          new Notice(`⚠ ${word.value} already exists`, 0);
          return;
        }

        await provider.addWordWithDictionary(word, dictionaryPath);
        // noinspection ObjectAllocationIgnored
        new Notice(`Added ${word.value}`);
        modal.close();
      }
    );

    modal.open();

    if (selectedWord) {
      modal.button.buttonEl.focus();
    } else {
      modal.wordTextArea.inputEl.focus();
    }
  }
}
