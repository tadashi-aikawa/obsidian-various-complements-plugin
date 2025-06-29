import { describe, expect, test } from "@jest/globals";
import { isMatchedGlobPatterns } from "./glob";

describe("isMatchedGlobPatterns", () => {
  test("should return false for empty patterns", () => {
    const result = isMatchedGlobPatterns("path/to/file.md", []);
    expect(result).toBe(false);
  });

  test("should match attachments folders", () => {
    const patterns = ["**/attachments/**"];
    expect(
      isMatchedGlobPatterns(
        "Database/Entertainment/Books/attachments/image.png",
        patterns,
      ),
    ).toBe(true);
    expect(
      isMatchedGlobPatterns(
        "Education/University/CS300/attachments/doc.pdf",
        patterns,
      ),
    ).toBe(true);
    expect(
      isMatchedGlobPatterns("Journal/2020/attachments/photo.jpg", patterns),
    ).toBe(true);
    expect(
      isMatchedGlobPatterns("Database/Entertainment/Books/notes.md", patterns),
    ).toBe(false);
  });

  test("should match files by extension", () => {
    const patterns = ["**/*.{png,jpg,gif}"];
    expect(isMatchedGlobPatterns("path/to/image.png", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("path/to/photo.jpg", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("path/to/animation.gif", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("path/to/document.pdf", patterns)).toBe(false);
    expect(isMatchedGlobPatterns("path/to/notes.md", patterns)).toBe(false);
  });

  test("should match specific directory patterns", () => {
    const patterns = ["Private/**"];
    expect(isMatchedGlobPatterns("Private/secrets.md", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("Private/folder/document.txt", patterns)).toBe(
      true,
    );
    expect(isMatchedGlobPatterns("Public/document.md", patterns)).toBe(false);
  });

  test("should match multiple patterns (OR logic)", () => {
    const patterns = ["**/attachments/**", "**/*.tmp", "Private/**"];
    expect(isMatchedGlobPatterns("folder/attachments/file.png", patterns)).toBe(
      true,
    );
    expect(isMatchedGlobPatterns("folder/temp.tmp", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("Private/secret.md", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("Public/document.md", patterns)).toBe(false);
  });

  test("should handle exact folder name matches", () => {
    const patterns = ["**/attachments"];
    expect(isMatchedGlobPatterns("Database/attachments", patterns)).toBe(true);
    expect(
      isMatchedGlobPatterns("folder/subfolder/attachments", patterns),
    ).toBe(true);
    expect(isMatchedGlobPatterns("attachments", patterns)).toBe(true);
    expect(isMatchedGlobPatterns("Database/attachments-backup", patterns)).toBe(
      false,
    );
    expect(
      isMatchedGlobPatterns("Database/attachments/file.png", patterns),
    ).toBe(false);
  });

  test("should handle invalid patterns gracefully", () => {
    const patterns = ["[invalid"];
    const result = isMatchedGlobPatterns("any/path.md", patterns);
    expect(result).toBe(false);
  });

  test("should handle mixed valid and invalid patterns", () => {
    const patterns = ["**/*.md", "[invalid", "**/attachments"];
    const result = isMatchedGlobPatterns("folder/document.md", patterns);
    expect(result).toBe(true);
  });
});
