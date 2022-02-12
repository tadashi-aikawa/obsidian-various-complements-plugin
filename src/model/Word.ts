export type WordType =
  | "currentFile"
  | "currentVault"
  | "customDictionary"
  | "internalLink"
  | "tag";

export interface DefaultWord {
  value: string;
  description?: string;
  aliases?: string[];
  type: WordType;
  createdPath: string;
  // Add after judge
  offset?: number;
}
export interface CurrentFileWord extends DefaultWord {
  type: "currentFile";
}
export interface CurrentVaultWord extends DefaultWord {
  type: "currentVault";
}
export interface CustomDictionaryWord extends DefaultWord {
  type: "customDictionary";
}
export interface InternalLinkWord extends DefaultWord {
  type: "internalLink";
  phantom?: boolean;
  aliasMeta?: {
    origin: string;
  };
}
export interface TagWord extends DefaultWord {
  type: "tag";
}

export type Word =
  | CurrentFileWord
  | CurrentVaultWord
  | CustomDictionaryWord
  | InternalLinkWord
  | TagWord;
