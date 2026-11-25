import { describe, expect, it } from "vitest";
import {
  bestForeground,
  contrastOnBlack,
  contrastOnWhite,
  contrastRatio,
  wcagLevel,
} from "@/features/palette-studio/lib/contrast";
import { hexToRgb } from "@/features/palette-studio/lib/color";
import {
  normalizeSimulation,
  simulateColorblind,
  simulatePalette,
  simulationIds,
} from "@/features/palette-studio/lib/color-blind";
import {
  cssVariables,
  paletteFilename,
  paletteJson,
  tailwindTheme,
} from "@/features/palette-studio/lib/export";

describe("contrast inspection", () => {
  it("computes WCAG ratios symmetrically", () => {
    expect(contrastRatio(hexToRgb("ffffff"), hexToRgb("000000"))).toBeCloseTo(21, 5);
    expect(contrastRatio(hexToRgb("000000"), hexToRgb("ffffff"))).toBeCloseTo(21, 5);
    expect(contrastOnWhite("ffffff")).toBeCloseTo(1, 5);
    expect(contrastOnBlack("000000")).toBeCloseTo(1, 5);
  });

  it("picks a readable foreground and classifies levels", () => {
    expect(bestForeground("ffffff")).toBe("#000000");
    expect(bestForeground("000000")).toBe("#ffffff");
    expect(wcagLevel(21)).toBe("AAA");
    expect(wcagLevel(5)).toBe("AA");
    expect(wcagLevel(3.5)).toBe("AA Large");
    expect(wcagLevel(2)).toBe("Fail");
  });
});

describe("color-blind simulation", () => {
  it("normalizes unknown simulation types", () => {
    expect(normalizeSimulation(undefined)).toBe("none");
    expect(normalizeSimulation("deuteranopia")).toBe("deuteranopia");
    expect(normalizeSimulation("x")).toBe("none");
  });

  it("leaves colours untouched when disabled", () => {
    expect(simulateColorblind("3e5c9e", "none")).toBe("3e5c9e");
    expect(simulatePalette(["3e5c9e"], "none")).toEqual(["3e5c9e"]);
  });

  it("produces valid, distinct colours for each simulation", () => {
    const results = simulationIds
      .filter((id) => id !== "none")
      .map((id) => simulateColorblind("ff0000", id));

    for (const hex of results) {
      expect(hex).toMatch(/^[0-9a-f]{6}$/);
    }
    expect(new Set(results).size).toBe(3);
  });

  it("keeps neutral greys neutral", () => {
    for (const id of simulationIds.filter((value) => value !== "none")) {
      const [r, g, b] = simulateColorblind("808080", id)
        .match(/../g)!
        .map((value) => parseInt(value, 16));

      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(10);
    }
  });
});

describe("palette exports", () => {
  const palette = ["3e5c9e", "abcdef", "ffffff"];
  const state = { color: "3e5c9e", harmony: "analogous" as const, count: 3 };

  it("emits CSS variables and Tailwind tokens", () => {
    expect(cssVariables(palette)).toContain("--palette-1: #3e5c9e;");
    expect(cssVariables(palette)).toContain("--palette-3: #ffffff;");
    expect(tailwindTheme(palette)).toContain("--color-palette-2: #abcdef;");
    expect(cssVariables(palette).split("\n")).toHaveLength(5);
  });

  it("serializes state and colours to JSON", () => {
    const parsed = JSON.parse(paletteJson(state, palette));

    expect(parsed.seed).toBe("#3e5c9e");
    expect(parsed.harmony).toBe("analogous");
    expect(parsed.colors).toEqual(["#3e5c9e", "#abcdef", "#ffffff"]);
  });

  it("builds a safe download filename", () => {
    expect(paletteFilename("#3E5C9E")).toBe("starrudder-palette-3e5c9e.png");
  });
});
