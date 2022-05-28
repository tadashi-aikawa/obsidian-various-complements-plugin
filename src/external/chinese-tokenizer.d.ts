declare module "chinese-tokenizer" {
  export interface TokenizedResult {
    text: string;
    traditional: string;
    simplified: string;
    position: {
      offset: number;
      line: number;
      column: number;
    };
    matches: unknown[];
  }

  export const loadFile: (path: string) => any;
  export const load: (
    content: string
  ) => (content: string) => TokenizedResult[];
}
