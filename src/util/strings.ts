const regEmoji = new RegExp(
  /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\uFE0E-\uFE0F]/,
  "g"
);

export function allAlphabets(text: string): boolean {
  return Boolean(text.match(/^[a-zA-Z0-9_-]+$/));
}

export function excludeEmoji(text: string): string {
  return text.replace(regEmoji, "");
}

export function excludeSpace(text: string): string {
  return text.replace(/ /g, "");
}

export function encodeSpace(text: string): string {
  return text.replace(/ /g, "%20");
}

export function lowerIncludes(one: string, other: string): boolean {
  return one.toLowerCase().includes(other.toLowerCase());
}

export function lowerIncludesWithoutSpace(one: string, other: string): boolean {
  return lowerIncludes(excludeSpace(one), excludeSpace(other));
}

export function lowerStartsWith(a: string, b: string): boolean {
  return a.toLowerCase().startsWith(b.toLowerCase());
}

export function lowerStartsWithoutSpace(one: string, other: string): boolean {
  return lowerStartsWith(excludeSpace(one), excludeSpace(other));
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function startsSmallLetterOnlyFirst(str: string): boolean {
  return Boolean(str.match(/^[A-Z][^A-Z]+$/));
}

export function* splitRaw(
  text: string,
  regexp: RegExp
): IterableIterator<string> {
  let previousIndex = 0;
  for (let r of text.matchAll(regexp)) {
    if (previousIndex !== r.index!) {
      yield text.slice(previousIndex, r.index!);
    }
    yield text[r.index!];
    previousIndex = r.index! + 1;
  }

  if (previousIndex !== text.length) {
    yield text.slice(previousIndex, text.length);
  }
}
