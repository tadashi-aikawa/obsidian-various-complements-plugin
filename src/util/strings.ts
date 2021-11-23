/**
 * This function uses case-sensitive logic if a second argument has an upper case. Otherwise, uses case-insensitive logic.
 */
export function caseIncludes(one: string, other: string): boolean {
  const lowerOther = other.toLowerCase();
  return lowerOther === other
    ? one.toLowerCase().includes(lowerOther)
    : one.includes(other);
}

export function caseIncludesWithoutSpace(one: string, other: string): boolean {
  return caseIncludes(one.replace(/ /g, ""), other.replace(/ /g, ""));
}

export function lowerStartsWith(a: string, b: string): boolean {
  return a.toLowerCase().startsWith(b.toLowerCase());
}
