import { Notice } from "obsidian";
import type { InternalLinkWord, Word } from "src/model/Word";
import { excludeEmoji, findCommonPrefix } from "../util/strings";
import type { AutoCompleteSuggest } from "./AutoCompleteSuggest";
import { InputDialog } from "./component/InputDialog";

export type CommandReturnType = boolean | undefined;

export function select(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
  index?: number,
): CommandReturnType {
  if (evt.isComposing) {
    return;
  }

  if (index !== undefined) {
    popup.setSelectionLock(false);
    popup.suggestions.setSelectedItem(index, evt);
  }

  if (popup.selectionLock) {
    popup.close();
    return true;
  } else {
    popup.suggestions.useSelectedItem({});
    return false;
  }
}

export async function selectWithCustomAlias(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
): Promise<InternalLinkWord | null> {
  if (!popup.context || evt.isComposing) {
    return null;
  }

  if (popup.selectionLock) {
    popup.close();
    return null;
  }

  const item = popup.suggestions.values[popup.suggestions.selectedItem];
  if (item.type !== "internalLink") {
    return null;
  }

  const input = await new InputDialog({
    title: "Type custom alias",
    defaultValue: item.value,
  }).open({ initialSelect: true });
  if (!input) {
    return null;
  }

  if (item.value === input) {
    return item;
  }

  item.aliasMeta = {
    origin: item.aliasMeta?.origin ?? item.value,
  };
  item.value = input;
  return item;
}

export function selectWithQueryAlias(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
): Word | null {
  if (!popup.context || evt.isComposing) {
    return null;
  }

  if (popup.selectionLock) {
    popup.close();
    return null;
  }

  const item = popup.suggestions.values[popup.suggestions.selectedItem];
  if (item.type !== "internalLink") {
    select(popup, evt);
    return null;
  }

  item.aliasMeta = {
    origin: item.aliasMeta?.origin ?? item.value,
  };
  item.valueForHistory = item.value;
  item.value = item.query!;

  return item;
}

export function insertAsText(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
): CommandReturnType {
  if (!popup.context || evt.isComposing) {
    return;
  }

  if (popup.selectionLock) {
    popup.close();
    return true;
  }

  const item = popup.suggestions.values[popup.suggestions.selectedItem];
  const editor = popup.context.editor;
  editor.replaceRange(
    item.value,
    {
      ...popup.context.start,
      ch: popup.contextStartCh + item.offset!,
    },
    popup.context.end,
  );

  return false;
}

export function selectNext(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
): CommandReturnType {
  if (popup.settings.noAutoFocusUntilCycle && popup.selectionLock) {
    popup.setSelectionLock(false);
  } else {
    popup.suggestions.setSelectedItem(popup.suggestions.selectedItem + 1, evt);
  }
  return false;
}

export function selectPrevious(
  popup: AutoCompleteSuggest,
  evt: KeyboardEvent,
): CommandReturnType {
  if (popup.settings.noAutoFocusUntilCycle && popup.selectionLock) {
    popup.setSelectionLock(false);
  } else {
    popup.suggestions.setSelectedItem(popup.suggestions.selectedItem - 1, evt);
  }
  return false;
}

export function open(popup: AutoCompleteSuggest): CommandReturnType {
  const item = popup.suggestions.values[popup.suggestions.selectedItem];
  if (
    item.type !== "currentVault" &&
    item.type !== "internalLink" &&
    item.type !== "frontMatter"
  ) {
    return false;
  }

  const markdownFile = popup.appHelper.getMarkdownFileByPath(item.createdPath);
  if (!markdownFile) {
    // noinspection ObjectAllocationIgnored
    new Notice(`Can't open ${item.createdPath}`);
    return false;
  }
  popup.appHelper.openMarkdownFile(markdownFile, true);
  return false;
}

export function completion(popup: AutoCompleteSuggest): CommandReturnType {
  if (!popup.context) {
    return;
  }

  const editor = popup.context.editor;
  const currentPhrase = editor.getRange(
    {
      ...popup.context.start,
      ch: popup.contextStartCh,
    },
    popup.context.end,
  );

  const tokens = popup.tokenizer.recursiveTokenize(currentPhrase);
  const commonPrefixWithToken = tokens
    .map((t) => ({
      token: t,
      commonPrefix: findCommonPrefix(
        popup.suggestions.values
          .map((x) => excludeEmoji(x.value))
          .filter((x) => x.toLowerCase().startsWith(t.word.toLowerCase())),
      ),
    }))
    .find((x) => x.commonPrefix != null);

  if (
    !commonPrefixWithToken ||
    currentPhrase === commonPrefixWithToken.commonPrefix
  ) {
    return false;
  }

  editor.replaceRange(
    commonPrefixWithToken.commonPrefix!,
    {
      ...popup.context.start,
      ch: popup.contextStartCh + commonPrefixWithToken.token.offset,
    },
    popup.context.end,
  );
  return true;
}
