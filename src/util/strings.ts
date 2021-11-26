export function lowerIncludes(one: string, other: string): boolean {
  return one.toLowerCase().includes(other.toLowerCase());
}

export function lowerIncludesWithoutSpace(one: string, other: string): boolean {
  return lowerIncludes(one.replace(/ /g, ""), other.replace(/ /g, ""));
}

export function lowerStartsWithoutSpace(one: string, other: string): boolean {
  return lowerStartsWith(one.replace(/ /g, ""), other.replace(/ /g, ""));
}

export function startsWithoutSpace(one: string, other: string): boolean {
  return one.replace(/ /g, "").startsWith(other.replace(/ /g, ""));
}

export function includesWithoutSpace(one: string, other: string): boolean {
  return one.replace(/ /g, "").includes(other.replace(/ /g, ""));
}

export function lowerStartsWith(a: string, b: string): boolean {
  return a.toLowerCase().startsWith(b.toLowerCase());
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
