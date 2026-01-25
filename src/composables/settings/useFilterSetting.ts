import type { Setting, SettingGroup } from "obsidian";

export const useFilterSetting = (group: SettingGroup) => {
  const filterTargets: {
    settingEl: HTMLElement;
    getSearchText: () => string;
  }[] = [];
  let latestQuery = "";

  const applyFilter = (query: string) => {
    latestQuery = query;
    const normalizedQuery = query.trim().toLowerCase();
    const shouldShowAll = normalizedQuery.length === 0;
    for (const target of filterTargets) {
      const searchText = target.getSearchText().toLowerCase();
      const isMatch = shouldShowAll || searchText.includes(normalizedQuery);
      target.settingEl.toggle(isMatch);
    }
  };

  const addFilterTarget = (
    element: HTMLElement,
    getSearchText: () => string,
  ) => {
    filterTargets.push({ settingEl: element, getSearchText });
    applyFilter(latestQuery);
  };

  const addFilterableSetting = (
    name: string,
    desc: string | DocumentFragment | null,
    build: (setting: Setting) => void,
  ) => {
    const searchText = name.trim();
    group.addSetting((setting) => {
      setting.setName(name);
      if (desc) {
        setting.setDesc(desc);
      }
      build(setting);
      addFilterTarget(setting.settingEl, () => searchText);
    });
  };

  group.addSearch((sc) => {
    sc.setPlaceholder("Filter settings").onChange((value) => {
      applyFilter(value);
    });
  });

  return { addFilterableSetting };
};
