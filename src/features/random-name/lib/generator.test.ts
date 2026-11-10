import { describe, expect, it } from "vitest";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";

describe("generateNameSuggestion", () => {
  it("returns the same name for the same seed and filters", () => {
    const first = generateNameSuggestion({
      culture: "japanese",
      gender: "neutral",
      vibe: "soft",
      includeMeaning: "true",
      seed: "abc12345",
    });

    const second = generateNameSuggestion({
      culture: "japanese",
      gender: "neutral",
      vibe: "soft",
      includeMeaning: "true",
      seed: "abc12345",
    });

    expect(first).toEqual(second);
  });

  it("omits meaning when the switch is off", () => {
    const result = generateNameSuggestion({
      culture: "english",
      gender: "any",
      vibe: "playful",
      includeMeaning: "false",
      seed: "quietfox",
    });

    expect(result.meaning).toBeUndefined();
  });
});
