import { describe, expect, it } from "vitest";
import {
  normalizeThemePreference,
  resolveTheme,
  themeInitScript,
  themeStorageKey,
} from "./theme";

describe("theme preference", () => {
  it("defaults unknown values to light", () => {
    expect(normalizeThemePreference(undefined)).toBe("light");
    expect(normalizeThemePreference("nonsense")).toBe("light");
    expect(normalizeThemePreference("dark")).toBe("dark");
    expect(normalizeThemePreference("system")).toBe("system");
  });

  it("resolves system preference from the media query result", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("ships a pre-hydration script that reads the stored key", () => {
    expect(themeInitScript).toContain(themeStorageKey);
    expect(themeInitScript).toContain('p="light"');
    expect(themeInitScript).toContain("prefers-color-scheme: dark");
  });
});
