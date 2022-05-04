import { App, FileSystemAdapter, Notice, request } from "obsidian";
import { pushWord, type WordsByFirstLetter } from "./suggester";
import type { ColumnDelimiter } from "../option/ColumnDelimiter";
import { isURL } from "../util/path";
import type { CustomDictionaryWord } from "../model/Word";
import { excludeEmoji } from "../util/strings";
import type { AppHelper } from "../app-helper";

type JsonDictionary = {
  /** If set, take precedence over ["Caret location symbol after complement"](https://tadashi-aikawa.github.io/docs-obsidian-various-complements-plugin/4.%20Options/4.6.%20Custom%20dictionary%20complement/%E2%9A%99%EF%B8%8FCaret%20location%20symbol%20after%20complement/) */
  caretSymbol?: string;
  /** If set, ignore ["Insert space after completion"](https://tadashi-aikawa.github.io/docs-obsidian-various-complements-plugin/4.%20Options/4.1.%20Main/%E2%9A%99%EF%B8%8FInsert%20space%20after%20completion/) */
  ignoreSpaceAfterCompletion?: boolean;
  words: {
    value: string;
    description?: string;
    aliases?: string[];
    /** If set, use this value for searching and rendering instead of `value` */
    displayed?: string;
  }[];
};

function escape(value: string): string {
  // This tricky logics for Safari
  // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/56
  return value
    .replace(/\\/g, "__VariousComplementsEscape__")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/__VariousComplementsEscape__/g, "\\\\");
}

function unescape(value: string): string {
  // This tricky logics for Safari
  // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/56
  return value
    .replace(/\\\\/g, "__VariousComplementsEscape__")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/__VariousComplementsEscape__/g, "\\");
}

function jsonToWords(
  json: JsonDictionary,
  path: string,
  systemCaretSymbol?: string
): CustomDictionaryWord[] {
  return json.words.map((x) => ({
    value: x.displayed || x.value,
    description: x.description,
    aliases: x.aliases,
    type: "customDictionary",
    createdPath: path,
    insertedText: x.displayed ? x.value : undefined,
    caretSymbol: json.caretSymbol ?? systemCaretSymbol,
    ignoreSpaceAfterCompletion: json.ignoreSpaceAfterCompletion,
  }));
}

function lineToWord(
  line: string,
  delimiter: ColumnDelimiter,
  path: string,
  delimiterForDisplay?: string,
  delimiterForHide?: string,
  systemCaretSymbol?: string
): CustomDictionaryWord {
  const [v, description, ...aliases] = line.split(delimiter.value);

  let value = unescape(v);
  let insertedText: string | undefined;
  let displayedText = value;

  if (delimiterForDisplay && value.includes(delimiterForDisplay)) {
    [displayedText, insertedText] = value.split(delimiterForDisplay);
  }
  if (delimiterForHide && value.includes(delimiterForHide)) {
    insertedText = value.replace(delimiterForHide, "");
    displayedText = `${value.split(delimiterForHide)[0]} ...`;
  }

  return {
    value: displayedText,
    description,
    aliases,
    type: "customDictionary",
    createdPath: path,
    insertedText,
    caretSymbol: systemCaretSymbol,
  };
}

function wordToLine(
  word: CustomDictionaryWord,
  delimiter: ColumnDelimiter,
  dividerForDisplay: string | null
): string {
  const value =
    word.insertedText && dividerForDisplay
      ? `${word.value}${dividerForDisplay}${word.insertedText}`
      : word.value;

  const escapedValue = escape(value);
  if (!word.description && !word.aliases) {
    return escapedValue;
  }
  if (!word.aliases) {
    return [escapedValue, word.description].join(delimiter.value);
  }
  return [escapedValue, word.description, ...word.aliases].join(
    delimiter.value
  );
}

function synonymAliases(name: string): string[] {
  const lessEmojiValue = excludeEmoji(name);
  return name === lessEmojiValue ? [] : [lessEmojiValue];
}

type Option = {
  regexp: string;
  delimiterForHide?: string;
  delimiterForDisplay?: string;
  caretSymbol?: string;
};

export class CustomDictionaryWordProvider {
  private words: CustomDictionaryWord[] = [];
  wordByValue: { [value: string]: CustomDictionaryWord } = {};
  wordsByFirstLetter: WordsByFirstLetter = {};

  private appHelper: AppHelper;
  private fileSystemAdapter: FileSystemAdapter;
  private paths: string[];
  private delimiter: ColumnDelimiter;
  private dividerForDisplay: string | null;

  constructor(app: App, appHelper: AppHelper) {
    this.appHelper = appHelper;
    this.fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
  }

  get editablePaths(): string[] {
    return this.paths.filter((x) => !isURL(x) && !x.endsWith(".json"));
  }

  private async loadWords(
    path: string,
    option: Option
  ): Promise<CustomDictionaryWord[]> {
    const contents = isURL(path)
      ? await request({ url: path })
      : await this.fileSystemAdapter.read(path);

    const words = path.endsWith(".json")
      ? jsonToWords(JSON.parse(contents), path, option.caretSymbol)
      : contents
          .split(/\r\n|\n/)
          .map((x) => x.replace(/%%.*%%/g, ""))
          .filter((x) => x)
          .map((x) =>
            lineToWord(
              x,
              this.delimiter,
              path,
              option.delimiterForDisplay,
              option.delimiterForHide,
              option.caretSymbol
            )
          );

    return words.filter(
      (x) => !option.regexp || x.value.match(new RegExp(option.regexp))
    );
  }

  async refreshCustomWords(option: Option): Promise<void> {
    this.clearWords();

    for (const path of this.paths) {
      try {
        const words = await this.loadWords(path, option);
        words.forEach((x) => this.words.push(x));
      } catch (e) {
        // noinspection ObjectAllocationIgnored
        new Notice(
          `⚠ Fail to load ${path} -- Various Complements Plugin -- \n ${e}`,
          0
        );
      }
    }

    this.words.forEach((x) => this.addWord(x));
  }

  async addWordWithDictionary(
    word: CustomDictionaryWord,
    dictionaryPath: string
  ): Promise<void> {
    this.addWord(word);
    await this.fileSystemAdapter.append(
      dictionaryPath,
      "\n" + wordToLine(word, this.delimiter, this.dividerForDisplay)
    );
  }

  private addWord(word: CustomDictionaryWord) {
    // Add aliases as a synonym
    const wordWithSynonym = {
      ...word,
      aliases: [...(word.aliases ?? []), ...synonymAliases(word.value)],
    };

    this.wordByValue[wordWithSynonym.value] = wordWithSynonym;
    pushWord(
      this.wordsByFirstLetter,
      wordWithSynonym.value.charAt(0),
      wordWithSynonym
    );
    wordWithSynonym.aliases?.forEach((a) =>
      pushWord(this.wordsByFirstLetter, a.charAt(0), wordWithSynonym)
    );
  }

  clearWords(): void {
    this.words = [];
    this.wordByValue = {};
    this.wordsByFirstLetter = {};
  }

  get wordCount(): number {
    return this.words.length;
  }

  setSettings(
    paths: string[],
    delimiter: ColumnDelimiter,
    dividerForDisplay: string | null
  ) {
    this.paths = paths;
    this.delimiter = delimiter;
    this.dividerForDisplay = dividerForDisplay;
  }
}
