export type WordType =
  | "currentFile"
  | "currentVault"
  | "customDictionary"
  | "internalLink";

export interface DefaultWord {
  value: string;
  description?: string;
  aliases?: string[];
  type: WordType;
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

export type Word =
  | CurrentFileWord
  | CurrentVaultWord
  | CustomDictionaryWord
  | InternalLinkWord;
