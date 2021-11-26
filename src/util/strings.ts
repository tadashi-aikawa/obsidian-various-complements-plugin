/**
 * This function uses case-sensitive logic if a second argument has an upper case. Otherwise, uses case-insensitive logic.
 */
export function caseIncludes(one: string, other: string): boolean {
    return one.includes(other);
}

export function caseIncludesWithoutSpace(one: string, other: string): boolean {
  return caseIncludes(one.replace(/ /g, ""), other.replace(/ /g, ""));
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function upperCaseIncludesWithoutSpace(one: string, other: string): boolean {
  if (capitalizeFirstLetter(other) != other) {
    return false;
  }
  let capitalizedOne = capitalizeFirstLetter(one);
  return caseIncludesWithoutSpace(capitalizedOne, other);
}

export function lowerStartsWith(a: string, b: string): boolean {
  return a.toLowerCase().startsWith(b.toLowerCase());
}
