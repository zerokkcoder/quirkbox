import { describe, expect, it } from "vitest";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";

describe("generateNameSuggestion", () => {
  it("returns the same name for the same seed and filters", async () => {
    const filters = { culture: "japanese", gender: "neutral", seed: "abc12345" };

    expect(await generateNameSuggestion(filters)).toEqual(await generateNameSuggestion(filters));
  });

  it("keeps the requested culture and returns a full name with a speech language code", async () => {
    const result = await generateNameSuggestion({ culture: "chinese-simplified", gender: "any", seed: "quietfox" });

    expect(result.culture).toBe("chinese-simplified");
    expect(result.fullName.length).toBeGreaterThan(1);
    expect(result.langCode).toBe("zh-CN");
  });

  it("composes family-name-first names for CJK cultures", async () => {
    const result = await generateNameSuggestion({ culture: "korean", gender: "feminine", seed: "hanwoo" });

    expect(result.gender).toBe("feminine");
    expect(result.fullName).not.toContain(" ");
    expect(result.fullName.length).toBeGreaterThan(1);
  });

  it("falls back to english for an unknown culture", async () => {
    const result = await generateNameSuggestion({ culture: "klingon", gender: "any", seed: "fallback" });

    expect(result.culture).toBe("english");
    expect(result.langCode).toBe("en-US");
  });
});
