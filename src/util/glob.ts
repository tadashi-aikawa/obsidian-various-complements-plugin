import micromatch from "micromatch";

export function isMatchedGlobPatterns(
  path: string,
  patterns: string[],
): boolean {
  if (patterns.length === 0) {
    return false;
  }

  try {
    return micromatch.isMatch(path, patterns);
  } catch (error) {
    console.warn(`Invalid glob pattern detected: ${error}`);
    return false;
  }
}
