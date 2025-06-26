import { App, Notice, PluginSettingTab, Setting, setIcon } from "obsidian";
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
// import { GestureHandler } from "./GestureHandler";
import { GestureHandler, SwipeEndEventDetail, TapEventDetail } from "./GestureHandler"; 

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

  // provider-specific trigger settings
  currentFileMinNumberOfCharactersForTrigger: number;
  currentVaultMinNumberOfCharactersForTrigger: number;
  customDictionaryMinNumberOfCharactersForTrigger: number;
  internalLinkMinNumberOfCharactersForTrigger: number;

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
  
  // --- New Mobile Nav and Tutorial ---
  mobileMode: "auto" | "on" | "off";
  mobileDebugSize: "none" | "large" | "small";
  tutorialCompleted: boolean;
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

  // provider-specific trigger settings
  currentFileMinNumberOfCharactersForTrigger: 0,
  currentVaultMinNumberOfCharactersForTrigger: 0,
  customDictionaryMinNumberOfCharactersForTrigger: 0,
  internalLinkMinNumberOfCharactersForTrigger: 0,

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
  
  // --- Mobile Navbar & Tutorial ---
  mobileMode: "auto",
  mobileDebugSize: "none",
  tutorialCompleted: false,
};

export class VariousComplementsSettingTab extends PluginSettingTab {
  plugin: VariousComponents;

  // --- State properties for the mobile UI. ---
  private isMobileMode: boolean = false;
  private mobileNavState: "collapsed" | "expanded" = "collapsed";
  private mobileNavBarEl: HTMLElement | null = null;
  private clickOutsideListener: ((event: PointerEvent) => void) | null = null; // --- Event listener for click outside the mobile nav bar to close it ---
  private gestureHandler: GestureHandler | null = null;

  // --- State properties for the tutorial ---
  // private tutorialStep: "start" | "swipeRight" | "swipeLeft" | "swipeUp" | "tap" | "done" = "start";
  private tutorialStep: "start" | "swipeRight" | "swipeLeft" | "swipeUp" | "tapCategoryName" | "tapMe" | "done" = "start";

  // ---🆘DEBUGFRAME: Properties for debug frame fix ---
  private debugFrameWrapper: HTMLElement | null = null;
  private originalContainerParent: HTMLElement | null = null;

  // --- A hack is used to make a fake close button that appears when the header becomes sticky.
  // Obsidian's settings pane doesn't exatly work well with UI that spans more than the padding of the container element. ---

  // --- New UI for better UX with Category Split, Navigations and 1HACK ---
  private scrollObserver: IntersectionObserver | null = null;
  private selectedCategory: string = "All";
  private static readonly CATEGORY_LIST = [
    "All",
    "General",
    "Matching & Filtering",
    "Triggering & Suppression",
    "Suggestion Sources",
    "Appearance & UI",
    "Key Customization",
    "Advanced",
  ];

  constructor(app: App, plugin: VariousComponents) {
    super(app, plugin);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  private handleClickOutside(event: PointerEvent) {
    if (
        this.mobileNavState === "expanded" &&
        this.mobileNavBarEl && 
        !this.mobileNavBarEl.contains(event.target as Node)
    ) {
        this.mobileNavState = "collapsed";
        this.display();
    }
  }

  // --- hide() method for a more robust cleanup. ---
  hide() {

    // Disconnect IntersectionObserver
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    // Remove the mobile navigation bar if it exists
    if (this.mobileNavBarEl) {
      this.mobileNavBarEl.remove();
      this.mobileNavBarEl = null;
    }
    // Remove the click listener to prevent memory leaks
    if (this.clickOutsideListener) {
      // this.containerEl.closest(".modal-content")?.removeEventListener("pointerdown", this.clickOutsideListener);
      // this.clickOutsideListener = null;
      document.removeEventListener("pointerdown", this.clickOutsideListener, { capture: true });
      this.clickOutsideListener = null;
    }
    // ---EAZY: Destroy the gesture handler if it exists ---
    if (this.gestureHandler) {
      this.gestureHandler.destroy();
      this.gestureHandler = null;
    }

    // ---🆘DEBUGFRAME: Cleanup for the new debug frame ---
    if (this.debugFrameWrapper && this.originalContainerParent) {
        // Move containerEl back to its original parent
        this.originalContainerParent.appendChild(this.containerEl);

        this.debugFrameWrapper.remove();

        // Reset state
        this.debugFrameWrapper = null;
        this.originalContainerParent = null;
        // Reset containerEl styles
        // this.containerEl.style.cssText = '';
    }

    this.containerEl.style.cssText = '';  // This must be outside the if block to ensure it always runs and reset the styles applied by the debug frame wrapper
  }


  async display(): Promise<void> {
    const { containerEl } = this;

    this.hide();
    containerEl.empty();

    // ---🆘DEBUGFRAME: The Render Debug frame Might be needed early so we call it here ---
    this.renderDebugFrame(this.containerEl);
    
    this.isMobileMode =
      this.plugin.settings.mobileMode === "on" ||
      (this.plugin.settings.mobileMode === "auto" && this.app.isMobile);

    containerEl.createEl("h2", { text: "Various Complements - Settings" });

    // --- Main content area where settings will be rendered. ---
    const settingsContentEl = containerEl.createDiv("vc-settings-content");

    if (this.isMobileMode) {
      // The mobile UI appends its footer to the main container, after the content.
      // this.renderMobileUI(containerEl, settingsContentEl);

      // --- Hack for Mobile Navbar css Sticky issues ---

      Object.assign(containerEl.style, {
        display: "flex",
        flexDirection: "column",
        height: "100%",
      });  // This pushes the sticky navbar to the bottom even when content is short.

      // Make the main settings area grow to take up all available space.
      settingsContentEl.style.flexGrow = "1";

      containerEl.style.paddingBottom = "env(safe-area-inset-bottom)";

      // --- Hack Ends ---

      // If we are in mobile mode, we ALWAYS need the click-outside listener.
      // Since hide() just removed it, we must add it back here.
      this.clickOutsideListener = this.handleClickOutside;
      document.addEventListener("pointerdown", this.clickOutsideListener, { capture: true });

      // Now we render the UI, which will create the `mobileNavBarEl` that the listener uses.
      this.renderMobileUI(containerEl, settingsContentEl);
    } else {
      // The desktop UI prepends its header to the main container, before the content.
      this.renderDesktopUI(containerEl, settingsContentEl);
    }

    // --- We proceed to render the settings into their dedicated container ANyways. ---
    this.renderSettingsContent(settingsContentEl);
  }

    // --- DESKTOP Header like Functionality ---
  private renderDesktopUI(containerEl: HTMLElement, contentEl: HTMLElement): void {
    const buttonBar = createDiv({
      cls: "various-complements__settings__category-bar",
    });
    // --- Prepend the header so it comes before the settings content. ---
    containerEl.insertBefore(buttonBar, contentEl);

    const computedStyles = window.getComputedStyle(containerEl);
    const paddingTop = computedStyles.paddingTop;
    const paddingLeft = computedStyles.paddingLeft;
    const paddingRight = computedStyles.paddingRight;

    Object.assign(buttonBar.style, {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "sticky",
      width: "auto",
      zIndex: "1",
      background: "var(--background-primary)",
      boxShadow: "0 2px 3px -2px var(--background-modifier-border)",
      pointerEvents: "none", // That hack mentinioned in the comment starts here
      top: `-${paddingTop}`,
      margin: `0 -${paddingRight} 0 -${paddingLeft}`,
      padding: `${paddingTop} ${paddingRight} 8px ${paddingLeft}`,
    });

    const buttonGrid = buttonBar.createDiv();
    Object.assign(buttonGrid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "4px",
      pointerEvents: "auto", // HACK: Re-enables clicks only for the grid and the buttons inside it
    });

    // --- Mobile Toggle Button ---
    const mobileToggleButton = buttonBar.createDiv();
    Object.assign(mobileToggleButton.style, {
      position: "absolute",
      top: `calc(${paddingTop} / 2 - 12px)`,
      left: `calc(${paddingLeft} / 2 - 12px)`,
      width: "24px",
      height: "24px",
      cursor: "pointer",
      pointerEvents: "auto",
      textAlign: "center",
      lineHeight: "35px",
    });
    setIcon(mobileToggleButton, "smartphone");
    mobileToggleButton.onclick = async () => {
        this.plugin.settings.mobileMode = "on";
        await this.plugin.saveSettings();
        this.display();
    }

    const fakeCloseButton = buttonBar.createDiv();
    Object.assign(fakeCloseButton.style, {
      position: "absolute",
      top: `calc(${paddingTop} / 2 - 12px)`,
      right: `calc(${paddingRight} / 2 - 30px)`, // this is 2 - 20px normally but because of the additional mobile stuff it's 2 - 30px
      width: "24px",
      height: "24px",
      cursor: "pointer",
      transition: "background-color 0.1s ease",
      fontSize: "28px",
      lineHeight: "24px",

      // --- Get rid of these for now... can be turned back on for only desktop mode ---

      // display: "flex",
      // alignItems: "center",
      // justifyContent: "center",
      // borderRadius: "var(--radius-s)",
      // visibility: "hidden",
      
    });
    fakeCloseButton.textContent = "\u00D7"; // The '×' character taken from obsidian

    // ---A sentinel element to detect when the header becomes sticky. ---
    const sentinel = containerEl.createDiv();
    sentinel.style.height = "1px"; // It must have a size to be observed
    containerEl.insertBefore(sentinel, buttonBar);

    // --- Intersection Observer to toggle the visibility of the fake close button ---
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      fakeCloseButton.style.visibility = !entries[0].isIntersecting ? "visible" : "hidden";
    };

    this.scrollObserver = new IntersectionObserver(observerCallback, {
      root: containerEl,
      threshold: 0.9,
    });
    this.scrollObserver.observe(sentinel);

    VariousComplementsSettingTab.CATEGORY_LIST.forEach((cat) => {
      // --- Conditional Styling for active category ---
      const buttonClasses = ["various-complements__settings__category-btn"];
      if (this.selectedCategory === cat) {
        buttonClasses.push("is-active");
      }

      const button = buttonGrid.createEl("button", {
        text: cat,
        cls: buttonClasses.join(" "),
      });
      button.style.fontSize = "var(--font-ui-small)";

      button.addEventListener("click", () => {
        this.selectedCategory = cat;
        this.display();
      });
    });
  }

  // --- Reusable helper method for changing categories ---
  private cycleCategory(direction: "left" | "right"): void {
    const currentIndex = VariousComplementsSettingTab.CATEGORY_LIST.indexOf(this.selectedCategory);
    const listLength = VariousComplementsSettingTab.CATEGORY_LIST.length;
    // The existing logic: left swipe moves to the next item (+1), right swipe moves to the previous (-1).
    const nextIndex = (currentIndex + (direction === "left" ? 1 : -1) + listLength) % listLength;
    this.selectedCategory = VariousComplementsSettingTab.CATEGORY_LIST[nextIndex];
  }

  // --- Same As Desktop but for Mobile... ---
  private renderMobileUI(containerEl: HTMLElement, contentEl: HTMLElement): void {

    const navParent = this.debugFrameWrapper || containerEl;  // ---🆘DEBUGFRAME: Use the debug frame wrapper if it exists, otherwise use the containerEl directly. ---
    const navWrapper = navParent.createDiv({ cls: "vc-mobile-nav-wrapper" }); // Updated to check for debug frame wrapper

    // const navWrapper = containerEl.createDiv({ cls: 'vc-mobile-nav-wrapper' });  // If debug frame wrapper is removed, use the containerEl directly.

    // --- Careful with deleting this part ---
    Object.assign(navWrapper.style, {
        position: this.debugFrameWrapper ? 'absolute' : 'sticky',  // Use absolute if debug frame wrapper exists, otherwise sticky.
        bottom: "10px",
        left: "10px",
        right: "10px",
        zIndex: "10",
        display: "flex",          // Use flexbox...
        justifyContent: "center", // ...to center the navbar horizontally.
        pointerEvents: "none",    // The wrapper itself is click-through... at least this part of it.
    });


    this.mobileNavBarEl = navWrapper.createDiv({ cls: "vc-mobile-nav" });
    const navBar = this.mobileNavBarEl;

    Object.assign(navBar.style, {
      height: this.mobileNavState === "collapsed" ? "55px" : "min(360px, 60vh)",
      display: "flex",
      width: "100%",
      maxWidth: "500px", // A sensible max-width for the nav bar.
      background: "rgba(var(--color-base-rgb), 0.8)",
      backdropFilter: "blur(16px) saturate(180%)",
      webkitBackdropFilter: "blur(16px) saturate(180%)",
      transition: "height 0.25s ease-out, border-radius 0.25s ease-out",
      flexDirection: "column",
      justifyContent: "flex-end",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: this.mobileNavState === "collapsed" ? "22px" : "20px 20px 0 0",
      pointerEvents: "auto",
      touchAction: "none",
    });
    navBar.empty();

     // --- CLEANUP & SETUP ---
    if (this.gestureHandler) {  // calling hide() will destroy a lot more than just the gesture handler
      this.gestureHandler.destroy();
    }

    // --- Initialize the GestureHandler with the navBar element ---
    this.gestureHandler = new GestureHandler(navBar);
    // this.gestureHandler = new GestureHandler(navBar, { lockDirection: true });
    // this.gestureHandler = new GestureHandler(navBar, { swipeThreshold: 20 });

    // --- This handles the tutorial gesture logic ---
    const handleGesture = (e: CustomEvent) => {
        if (!this.plugin.settings.tutorialCompleted) {
            this.handleTutorialAction(e);
            return;
        }
        // If the tutorial is not completed, we handle the gestures for the tutorial.
        // If the tutorial is completed, we handle the gestures normally.
        if (e.type === "gestures-swipeend") {
            const detail = e.detail as SwipeEndEventDetail;
            const { direction } = detail;

            if (this.mobileNavState === "collapsed") {
                if (direction === "left" || direction === "right") {
                    this.cycleCategory(direction);
                    this.display();
                } else if (direction === "up") {
                    this.mobileNavState = "expanded";
                    this.display();
              }
            } else if (this.mobileNavState === "expanded" && direction === "down") {
              this.mobileNavState = "collapsed";
              this.display();
            }
        }
    };

    navBar.addEventListener("gestures-swipeend", handleGesture);
    navBar.addEventListener("tap", handleGesture); // Listen for taps for the tutorial will be important later

      
    this.clickOutsideListener = (event: PointerEvent) => {
      if (this.mobileNavState === "expanded") {
          const navBar = this.mobileNavBarEl;

          if (navBar && !navBar.contains(event.target as Node) && event.target !== navBar) {
              this.mobileNavState = "collapsed";
              this.display();
          }
      }
    };
    containerEl.closest(".modal-content")?.addEventListener("pointerdown", this.clickOutsideListener);



    // --- Render the mobile navigation bar based on the current state ---
    if (this.mobileNavState === "collapsed") {
      const collapsedView = navBar.createDiv({ cls: "vc-collapsed-view" });
      Object.assign(collapsedView.style, {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          height: "100%",
          gap: "12px"
      });

      // Create a div for the desktop toggle icon
      const desktopToggle = collapsedView.createDiv({ cls: "clickable-icon vc-desktop-toggle" });
      setIcon(desktopToggle, "monitor");
      // We are using onclick insted of pointerdown here to avoid conflicts with the gesture handler.
      desktopToggle.onclick = () => {
          this.plugin.settings.mobileMode = "off"; // Set mobile mode to off
          this.plugin.saveSettings().then(() => this.display()); // Save settings and re-render the display
      };

      // Create a div for the category text, displaying the currently selected category
      const categoryText = collapsedView.createDiv({
        text: this.selectedCategory, cls: "clickable-text vc-category-text"
      });
      Object.assign(categoryText.style, {
          flexGrow: "1",
          textAlign: "center",
          fontWeight: "600",
          color: "var(--interactive-accent)",
          cursor: "pointer"
      });
      // we are using onclick insted of pointerdown here to avoid conflicts with the gesture handler.
      categoryText.onclick = () => {
        // If it's the right tutorial step, let the gesture handler deal with it.
        // We do this by simulating a tap event detail for our handler.
        if (!this.plugin.settings.tutorialCompleted && this.tutorialStep === "tapCategoryName") {
            // If so, advance the tutorial to the next step. manually 😒
            this.tutorialStep = "tapMe";
        }

        // Otherwise, perform the normal action.
        console.log("Category text clicked!");

        // this.mobileNavState = "expanded";
        // this.display();

        // Sweet ANimation below

        navBar.addClass("vc-tutorial-complete");
        setTimeout(() => {
            this.mobileNavState = "expanded";
            this.display();
        }, 350);
      };

      // // Create a div for the expand icon
      // const expandIcon = collapsedView.createDiv({ cls: "clickable-icon vc-expand-icon" });
      // // Set an icon for the expand toggle
      // setIcon(expandIcon, "chevrons-up-down");
      // expandIcon.onclick = () => {
      //   console.log("Expand icon clicked!");
      //   this.mobileNavState = 'expanded';
      //   this.display();
      // };

      // --- Conditionally render tutorial or expand icon ---
      if (!this.plugin.settings.tutorialCompleted) {
          this.renderMobileTutorial(collapsedView);
      } else {
          const expandIcon = collapsedView.createDiv({ cls: "clickable-icon vc-expand-icon" });
          setIcon(expandIcon, "chevrons-up-down");
          expandIcon.onclick = () => {
            this.mobileNavState = 'expanded';
            this.display();
          };
      }

    } else { // Expanded State
      // Create the main container for the expanded view
      const expandedView = navBar.createDiv();
      Object.assign(expandedView.style, {
          display: "flex",
          flexDirection: "column",
          padding: "0 16px 16px 16px",
          gap: "8px",
          height: "100%",
          overflowY: "auto",
          touchAction: "none",
      });

      // Create a visual collapse bar (for aesthetics cuz why not)
      const collapseBar = expandedView.createDiv();
      Object.assign(collapseBar.style, {
          width: "40px",
          height: "5px",
          background: "var(--text-faint)",
          borderRadius: "3px",
          margin: "8px auto 12px",
          flexShrink: "0"
      });

      // Iterate through a predefined list of categories to create buttons
      VariousComplementsSettingTab.CATEGORY_LIST.forEach(cat => {
          const button = expandedView.createEl("button", {
            text: cat, cls: "various-complements__settings__category-btn"
          }); // buttons created for each category
          button.dataset.category = cat; // Store the category name here
          button.style.flexGrow = "1"; // Allow button to grow and take available space
          // button.style.fontSize = "var(--font-ui-small)";
          if (this.selectedCategory === cat) button.addClass("is-active");

          button.onclick = () => {
              this.selectedCategory = cat;
              this.mobileNavState = "collapsed";
              this.display();
          };

      });
    }
  }

   // --- Separated for sanity: Method to render the tutorial steps ---
  private renderMobileTutorial(parentEl: HTMLElement): void {
    const tutorialContainer = parentEl.createDiv({ cls: "vc-tutorial-container" });
    let text = "";
    let animationClass = "";

    switch (this.tutorialStep) {
        case "start": // Initial state, same as swipeRight
            this.tutorialStep = "swipeRight";
        case "swipeRight":
            text = "Swipe Right";
            animationClass = "vc-tutorial-arrow vc-tutorial-arrow-swipe-right";
            break;
        case "swipeLeft":
            text = "Swipe Left";
            animationClass = "vc-tutorial-arrow vc-tutorial-arrow-swipe-left";
            break;
        case "swipeUp":
            text = "Swipe Up";
            animationClass = "vc-tutorial-arrow vc-tutorial-arrow-swipe-up";
            break;
        case "tapCategoryName":
            text = "Tap Category Name";
            // No animation, the prompt is the guide.
            break;
        case "tapMe":
            text = "Tap Me";
            animationClass = "vc-tutorial-tap-pulse";
            break;
    }

    tutorialContainer.createDiv({ text: text, cls: "vc-tutorial-text" });
    if (animationClass) {
        const animEl = tutorialContainer.createDiv({ cls: animationClass });
        if (animationClass.includes("arrow")) {
          setIcon(animEl, "arrow-right");
        }
    }
  }

  // --- A handler for tutorial actions ---
  private handleTutorialAction(e: CustomEvent): void {
    // If the user needs to tap the category name but has opened the expanded view,
    // we pause the tutorial. They must collapse the view first to proceed. "cuz expanded view make collapsed view useless"
    if (this.tutorialStep === "tapCategoryName" && this.mobileNavState === "expanded") {
        e.stopPropagation();
        return;
    }

    e.stopPropagation();

    if (e.type === "gestures-swipeend") {
        const { direction } = e.detail as SwipeEndEventDetail;
        switch (this.tutorialStep) {
            case "swipeRight":
                if (direction === "right") {
                    this.cycleCategory("right");
                    this.tutorialStep = "swipeLeft";  // <-- Transition to the new step manually
                    this.display();
                }
                break;
            case "swipeLeft":
                if (direction === "left") {
                    this.cycleCategory("left");
                    this.tutorialStep = "swipeUp";
                    this.display();
                }
                break;
            case "swipeUp":
                if (direction === "up") {
                    this.mobileNavState = "expanded";
                    this.tutorialStep = "tapCategoryName";
                    this.display();
                }
                break;
        }
    } else if (e.type === "tap") {
        const { target } = e.detail as TapEventDetail;

        switch (this.tutorialStep) {
            case "tapCategoryName":
                // leave this block empty... it's being handled by the category text onclick handler.
                // The gesture handler will still catch the tap, but nothing will happen,
                // which is fine. The direct `onclick` is more reliable.
                break;

            case "tapMe":
                // --- GuardRail to ensure this only runs when collapsed. ---
                // This prevents accidental completion when the nav bar is expanded.
                if (this.mobileNavState === "collapsed") {
                    this.plugin.settings.tutorialCompleted = true;
                    this.plugin.saveSettings();

                    const navBar = this.mobileNavBarEl;
                    if (navBar) {
                        navBar.addClass("vc-tutorial-complete");
                        setTimeout(() => {
                            this.mobileNavState = "collapsed";
                            this.display();
                        }, 500);
                    }
                }
                break;
          }
      }
  }

  // ---🆘DEBUGFRAME: Method to render the debug frame ---
  private renderDebugFrame(containerEl: HTMLElement): void {
    const size = this.plugin.settings.mobileDebugSize;
    if (size === "none") {
      return; 
    }

    const modal = containerEl.closest(".modal-container");
    if (!modal) return; // Cannot create frame without the modal root

    const dimensions = size === "large"
        ? { width: "428px", height: "926px" }
        : { width: "375px", height: "812px" };
    
    // Create the phone frame wrapper and attach it to the modal background
    this.debugFrameWrapper = createDiv({ cls: "debug-frame-wrapper" });
    Object.assign(this.debugFrameWrapper.style, {
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: dimensions.width, height: dimensions.height,
        padding: "8px",
        background: "black",
        borderRadius: "40px",
        boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        zIndex: "99",
    });
    
    // Store the original parent and then move containerEl inside our new frame
    this.originalContainerParent = containerEl.parentElement;
    this.debugFrameWrapper.appendChild(containerEl);
    modal.appendChild(this.debugFrameWrapper);
    
    // Style the containerEl to be the scrollable content area
    Object.assign(containerEl.style, {
        width: "100%", height: "100%",
        position: "relative",
        top: "0", left: "0",
        transform: "none",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--background-primary)",
        borderRadius: "32px",
    });
  }

  // --- Conditional settings displayed based on selected category ---
  private async renderSettingsContent(containerEl: HTMLElement) {
    const showAll = this.selectedCategory === "All";
    if (showAll || this.selectedCategory === "General") {
      await this.addGeneralCoreSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Matching & Filtering") {
      await this.addMatchingFilteringSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Triggering & Suppression") {
      await this.addTriggeringSuppressionSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Suggestion Sources") {
      this.addSuggestionSourcesSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Appearance & UI") {
      this.addAppearanceUiSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Key Customization") {
    this.addKeyCustomizationSettings(containerEl);
    }
    if (showAll || this.selectedCategory === "Advanced") {
      await this.addAdvancedSettings(containerEl);
    }
  }

  // --- Category splits General ---
  private async addGeneralCoreSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "General",
      cls: "various-complements__settings__header",
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

      const hasCedict = await this.app.vault.adapter.exists(
        this.plugin.settings.cedictPath,
      );
      if (!hasCedict) {
        containerEl.createEl("div", {
          text: `⚠ cedict_ts.u8 doesn't exist in ${this.plugin.settings.cedictPath}.`,
          cls: "various-complements__settings__warning",
        });
      }
    }

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

  // --- Category Splits Matching & Filtering ---
  private async addMatchingFilteringSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Matching & Filtering",
      cls: "various-complements__settings__header",
    });

    containerEl.createEl("h4", { text: "Matching Strategy" });

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

    containerEl.createEl("h4", { text: "Character & Word Handling" });

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
  }

  // --- Category Splits "Triggering & Suppression" ---
  private async addTriggeringSuppressionSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Triggering & Suppression",
      cls: "various-complements__settings__header",
    });

    containerEl.createEl("h4", { text: "Activation Rules" });

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

    containerEl.createEl("h4", { text: "Exclusion Rules (Suppression)" });

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
  }

  // --- Category SPlits Appearance & UI ---
  private addAppearanceUiSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Appearance & UI",
      cls: "various-complements__settings__header",
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

  // --- Category Splits Key Customization ---
  private addKeyCustomizationSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Key Customization",
      cls: "various-complements__settings__header",
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

    new Setting(div).setHeading().setName("Hotkeys Description").setDesc(df);

    const hotkeys = this.plugin.settings.hotkeys;
    Object.keys(hotkeys).forEach((k: string) => {
      const key = k as keyof Settings["hotkeys"];
      const name =
        key.startsWith("select") && key.endsWith("th")
          ? key.replace("select", "select ")
          : key;

      new Setting(div)
        .setName(name)
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
  }

  // --- Category Splits Suggestion Sources ---
  private addSuggestionSourcesSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Suggestion Sources",
      cls: "various-complements__settings__header",
    });

    containerEl.createEl("h4", { text: "Current File Complement" });
    this.renderCurrentFileComplementSettings(containerEl);

    containerEl.createEl("h4", { text: "Current Vault Complement" });
    this.renderCurrentVaultComplementSettings(containerEl);

    containerEl.createEl("h4", { text: "Custom Dictionary Complement" });
    this.renderCustomDictionaryComplementSettings(containerEl);

    containerEl.createEl("h4", { text: "Internal Link Complement" });
    this.renderInternalLinkComplementSettings(containerEl);

    containerEl.createEl("h4", { text: "Front Matter Complement" });
    this.renderFrontMatterComplementSettings(containerEl);

  }

  // --- Category Splits Advanced ---
  private async addAdvancedSettings(containerEl: HTMLElement) {
    containerEl.createEl("h3", {
      text: "Advanced",
      cls: "various-complements__settings__header",
    });

    containerEl.createEl("h4", { text: "Intelligent Suggestion Prioritization" });
    this.renderIntelligentSuggestionPrioritizationSettings(containerEl);

    // ---🆘DEBUGFRAME: 2 settings + 1 for reset tutorial ---
    containerEl.createEl("h4", { text: "Mobile / Debug" });
    new Setting(containerEl)
      .setName("Force Mobile View")
      .setDesc("Overrides automatic detection to turn mobile view on or off.")
      .addDropdown(dd => dd
        .addOptions({ auto: "Auto", on: "On", off: "Off" })
        .setValue(this.plugin.settings.mobileMode)
        .onChange(async (val: "auto" | "on" | "off") => {
          this.plugin.settings.mobileMode = val;
          await this.plugin.saveSettings();
          this.display();
        }));

    new Setting(containerEl)
      .setName("Mobile Debug Frame")
      .setDesc("Displays a phone-sized frame for easier debugging on desktop.")
      .addDropdown(dd => dd
        .addOptions({ none: "None", large: "iPhone 14 Pro Max", small: "iPhone 12 Mini" })
        .setValue(this.plugin.settings.mobileDebugSize)
        .onChange(async (val: "none" | "large" | "small") => {
          this.plugin.settings.mobileDebugSize = val;
          await this.plugin.saveSettings();
          this.display();
        }));

    // --- Reset tutorial button ---
    new Setting(containerEl)
      .setName("Reset mobile tutorial")
      .setDesc("Show the quick-start gesture tutorial again on the next visit.")
      .addButton(btn => btn
          .setButtonText("Reset")
          .onClick(async () => {
              this.plugin.settings.tutorialCompleted = false;
              this.tutorialStep = 'start'; // Reset internal state too
              this.tutorialTapCount = 0;
              await this.plugin.saveSettings();
              new Notice("Tutorial has been reset. Re-open settings to see it.");
              this.display(); 
          }));
    // --- END: 🆘DEBUGFRAME ---

    containerEl.createEl("h4", { text: "Mobile" });
    this.renderMobileSettings(containerEl);

    containerEl.createEl("h4", { text: "Debug" });
    this.renderDebugSettings(containerEl);
  }

  // ---The following methods render settings for sub-categories without creating a main header :XD ---
  private renderCurrentFileComplementSettings(containerEl: HTMLElement) {
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setName("Min number of characters for trigger")
        .setDesc(
          "Override the main trigger setting for this provider. Set 0 to use the main setting value.",
        )
        .setClass("various-complements__settings__nested")
        .addSlider((sc) =>
          sc
            .setLimits(0, 10, 1)
            .setValue(
              this.plugin.settings.currentFileMinNumberOfCharactersForTrigger,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.currentFileMinNumberOfCharactersForTrigger =
                value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Exclude word patterns for indexing")
        .setDesc(
          "Regexp patterns for words to be excluded from the suggestions, separated by line breaks.",
        )
        .setClass("various-complements__settings__nested")
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

  private renderCurrentVaultComplementSettings(containerEl: HTMLElement) {
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setName("Min number of characters for trigger")
        .setDesc(
          "Override the main trigger setting for this provider. Set 0 to use the main setting value.",
        )
        .setClass("various-complements__settings__nested")
        .addSlider((sc) =>
          sc
            .setLimits(0, 10, 1)
            .setValue(
              this.plugin.settings.currentVaultMinNumberOfCharactersForTrigger,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.currentVaultMinNumberOfCharactersForTrigger =
                value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Exclude word patterns for indexing")
        .setDesc(
          "Regexp patterns for words to be excluded from the suggestions, separated by line breaks.",
        )
        .setClass("various-complements__settings__nested")
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

  private renderCustomDictionaryComplementSettings(containerEl: HTMLElement) {
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
        .setClass("various-complements__settings__nested")
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

      new Setting(containerEl)
        .setName("Column delimiter")
        .setClass("various-complements__settings__nested")
        .addDropdown((tc) =>
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
        .addText((cb) => {
          cb.setValue(this.plugin.settings.displayedTextSuffix).onChange(
            async (value) => {
              this.plugin.settings.displayedTextSuffix = value;
              await this.plugin.saveSettings();
            },
          );
        });

      new Setting(containerEl)
        .setName("Min number of characters for trigger")
        .setDesc(
          "Override the main trigger setting for this provider. Set 0 to use the main setting value.",
        )
        .setClass("various-complements__settings__nested")
        .addSlider((sc) =>
          sc
            .setLimits(0, 10, 1)
            .setValue(
              this.plugin.settings
                .customDictionaryMinNumberOfCharactersForTrigger,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.customDictionaryMinNumberOfCharactersForTrigger =
                value;
              await this.plugin.saveSettings();
            }),
        );
    }
  }

  private renderInternalLinkComplementSettings(containerEl: HTMLElement) {
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
      
      new Setting(containerEl)
        .setName("Min number of characters for trigger")
        .setDesc(
          "Override the main trigger setting for this provider. Set 0 to use the main setting value.",
        )
        .setClass("various-complements__settings__nested")
        .addSlider((sc) =>
          sc
            .setLimits(0, 10, 1)
            .setValue(
              this.plugin.settings.internalLinkMinNumberOfCharactersForTrigger,
            )
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.internalLinkMinNumberOfCharactersForTrigger =
                value;
              await this.plugin.saveSettings();
            }),
        );
    }
  }

  private renderFrontMatterComplementSettings(containerEl: HTMLElement) {
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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

  private renderIntelligentSuggestionPrioritizationSettings(
    containerEl: HTMLElement,
  ) {
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
        .setName("History file path")
        .setDesc(`Default: ${DEFAULT_HISTORIES_PATH}`)
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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
        .setClass("various-complements__settings__nested")
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

  private renderMobileSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName("Disable auto-complete on mobile")
      .setDesc("Globally disable suggestion functionality while on a mobile device.")
      .addToggle((tc) => {
      tc.setValue(this.plugin.settings.disableOnMobile).onChange(
        async (value) => {
          this.plugin.settings.disableOnMobile = value;
          await this.plugin.saveSettings();
        },
      );
    });
  }

  private renderDebugSettings(containerEl: HTMLElement) {
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