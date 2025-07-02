import { minimatch } from "minimatch";

export function isMatchedGlobPatterns(
  path: string,
  patterns: string[],
): boolean {
  if (patterns.length === 0) {
    return false;
  }

  try {
    return patterns.some((p) => minimatch(path, p));
  } catch (error) {
    console.warn(`Invalid glob pattern detected: ${error}`);
    return false;
  }
}
