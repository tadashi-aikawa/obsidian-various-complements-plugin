import TinySegmenter from "../../external/tiny-segmenter";
import { joinNumberWithSymbol } from "../../util/strings";
import { AbstractTokenizer } from "./AbstractTokenizer";
// @ts-ignore
const segmenter = new TinySegmenter();

function pickTokensAsJapanese(content: string, trimPattern: RegExp): string[] {
  return content
    .split(trimPattern)
    .filter((x) => x !== "")
    .flatMap<string>((x) => joinNumberWithSymbol(segmenter.segment(x)));
}

/**
 * Japanese needs original logic.
 */
export class JapaneseTokenizer extends AbstractTokenizer {
  tokenize(content: string, raw?: boolean): string[] {
    return pickTokensAsJapanese(
      content,
      raw ? / /g : this.getTrimPattern("indexing")
    );
  }

  recursiveTokenize(content: string): { word: string; offset: number }[] {
    const tokens: string[] = joinNumberWithSymbol(
      segmenter
        .segment(content)
        // https://github.com/tadashi-aikawa/obsidian-various-complements-plugin/issues/77
        .flatMap((x: string) =>
          x === " " ? x : x.split(" ").map((t) => (t === "" ? " " : t))
        )
    );

    const ret = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i === 0 || tokens[i].length !== 1 || tokens[i] !== " ") {
        ret.push({
          word: tokens.slice(i).join(""),
          offset: tokens.slice(0, i).join("").length,
        });
      }
    }

    return ret;
  }

  shouldIgnoreOnCurrent(str: string): boolean {
    return Boolean(str.match(/^[ぁ-んａ-ｚＡ-Ｚ。、ー　]*$/));
  }
}
