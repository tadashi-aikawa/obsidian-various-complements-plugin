import chineseTokenizer from "chinese-tokenizer";
import { AbstractTokenizer } from "./AbstractTokenizer";

/**
 * Chinese needs original logic.
 */
export class ChineseTokenizer extends AbstractTokenizer {
  _tokenize: ReturnType<typeof chineseTokenizer.load>;

  static create(dict: string): ChineseTokenizer {
    const ins = new ChineseTokenizer();
    ins._tokenize = chineseTokenizer.load(dict);
    return ins;
  }

  tokenize(content: string, raw?: boolean): string[] {
    return content
      .split(raw ? / /g : this.getTrimPattern("indexing"))
      .filter((x) => x !== "")
      .flatMap((x) => this._tokenize(x))
      .map((x) => x.text);
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const tokens: string[] = this._tokenize(content).map((x) => x.text);

    const ret = [];
    for (let i = 0; i < tokens.length; i++) {
      if (
        i === 0 ||
        tokens[i].length !== 1 ||
        !Boolean(tokens[i].match(this.getTrimPattern("input")))
      ) {
        ret.push({
          word: tokens.slice(i).join(""),
          offset: tokens.slice(0, i).join("").length,
        });
      }
    }

    return ret;
  }
}
