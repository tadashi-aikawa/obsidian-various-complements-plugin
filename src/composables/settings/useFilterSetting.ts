import type { Setting, SettingGroup } from "obsidian";

const ALWAYS_VISIBLE = () => true;

export const useFilterSetting = (group: SettingGroup) => {
  const filterTargets: {
    settingEl: HTMLElement;
    getSearchText: () => string;
    isVisible: () => boolean;
  }[] = [];
  const conditionalElements: {
    el: HTMLElement;
    isVisible: () => boolean;
  }[] = [];
  let latestQuery = "";

  const applyFilter = (query: string) => {
    latestQuery = query;
    const normalizedQuery = query.trim().toLowerCase();
    const shouldShowAll = normalizedQuery.length === 0;
    for (const target of filterTargets) {
      const searchText = target.getSearchText().toLowerCase();
      const isMatch = shouldShowAll || searchText.includes(normalizedQuery);
      target.settingEl.toggle(isMatch && target.isVisible());
    }
    for (const target of conditionalElements) {
      target.el.toggle(target.isVisible());
    }
  };

  const addFilterTarget = (
    element: HTMLElement,
    getSearchText: () => string,
    isVisible: () => boolean,
  ) => {
    filterTargets.push({ settingEl: element, getSearchText, isVisible });
    applyFilter(latestQuery);
  };

  /**
   * Adds a setting to the group.
   * `option.visible` makes the setting depend on another setting: it is shown
   * only while the predicate returns true and the filter query matches.
   */
  const addFilterableSetting = (
    name: string,
    desc: string | DocumentFragment | null,
    build: (setting: Setting) => void,
    option?: { visible?: () => boolean },
  ) => {
    const searchText = name.trim();
    group.addSetting((setting) => {
      setting.setName(name);
      if (desc) {
        setting.setDesc(desc);
      }
      build(setting);
      addFilterTarget(
        setting.settingEl,
        () => searchText,
        option?.visible ?? ALWAYS_VISIBLE,
      );
    });
  };

  /**
   * Registers an element (ex: a warning message) that is shown only while
   * `isVisible` returns true. Unlike settings, it ignores the filter query.
   */
  const addConditionalElement = (el: HTMLElement, isVisible: () => boolean) => {
    conditionalElements.push({ el, isVisible });
    el.toggle(isVisible());
  };

  /**
   * Re-evaluates the visibility of every registered element.
   * Call it after changing a setting that other settings depend on, instead of
   * rebuilding the whole settings tab.
   */
  const refresh = () => {
    applyFilter(latestQuery);
  };

  group.addSearch((sc) => {
    sc.setPlaceholder("Filter settings").onChange((value) => {
      applyFilter(value);
    });
  });

  return { addFilterableSetting, addConditionalElement, refresh };
};
