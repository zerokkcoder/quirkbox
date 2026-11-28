import { describe, expect, it } from "vitest";
import { effectivePrice, parseRates } from "./rates";
import type { LlmPrice } from "./types";

const validRates = {
  meta: { updatedAt: "2026-11-28", note: "test" },
  llmPricing: [
    {
      vendor: "Google",
      model: "Gemini 4 Argon",
      inputPerM: 2,
      outputPerM: 10,
      currency: "USD",
      promoUntil: "2026-11-30",
      regularInputPerM: 4,
      regularOutputPerM: 20,
      confidence: "medium",
    },
  ],
};

describe("parseRates", () => {
  it("accepts a well-formed rates payload", () => {
    const parsed = parseRates(validRates);
    expect(parsed).not.toBeNull();
    expect(parsed?.llmPricing[0].model).toBe("Gemini 4 Argon");
  });

  it("carries a valid exchangeRate and fxDate into meta", () => {
    const parsed = parseRates({
      ...validRates,
      meta: { updatedAt: "2026-11-28", exchangeRate: 6.6544, fxDate: "2026-11-27" },
    });
    expect(parsed?.meta.exchangeRate).toBe(6.6544);
    expect(parsed?.meta.fxDate).toBe("2026-11-27");
  });

  it("ignores a non-positive exchangeRate", () => {
    const parsed = parseRates({
      ...validRates,
      meta: { updatedAt: "2026-11-28", exchangeRate: -1 },
    });
    expect(parsed?.meta.exchangeRate).toBeUndefined();
  });

  it("rejects null, arrays and objects missing llmPricing", () => {
    expect(parseRates(null)).toBeNull();
    expect(parseRates([])).toBeNull();
    expect(parseRates({ meta: { updatedAt: "2026-11-28" } })).toBeNull();
  });

  it("rejects entries with non-numeric or negative prices", () => {
    expect(
      parseRates({
        meta: { updatedAt: "2026-11-28" },
        llmPricing: [{ model: "x", inputPerM: "2", outputPerM: 10 }],
      })
    ).toBeNull();
    expect(
      parseRates({
        meta: { updatedAt: "2026-11-28" },
        llmPricing: [{ model: "x", inputPerM: -1, outputPerM: 10 }],
      })
    ).toBeNull();
  });

  it("drops invalid entries but keeps valid ones", () => {
    const parsed = parseRates({
      meta: { updatedAt: "2026-11-28" },
      llmPricing: [
        { model: "good", inputPerM: 1, outputPerM: 5 },
        { model: "bad", inputPerM: "x", outputPerM: 5 },
      ],
    });
    expect(parsed?.llmPricing).toHaveLength(1);
  });
});

describe("effectivePrice", () => {
  const price = validRates.llmPricing[0] as LlmPrice;

  it("uses the promotional price before promoUntil", () => {
    expect(effectivePrice(price, new Date("2026-11-28T00:00:00Z"))).toEqual({
      inputPerM: 2,
      outputPerM: 10,
    });
  });

  it("falls back to the regular price on the day after promoUntil", () => {
    expect(effectivePrice(price, new Date("2026-12-01T00:00:00Z"))).toEqual({
      inputPerM: 4,
      outputPerM: 20,
    });
  });

  it("keeps the base price when there is no promotion", () => {
    const plain: LlmPrice = {
      vendor: "OpenAI",
      model: "GPT-6 Luna",
      inputPerM: 0.1,
      outputPerM: 0.5,
      currency: "USD",
    };
    expect(effectivePrice(plain, new Date("2026-12-01T00:00:00Z"))).toEqual({
      inputPerM: 0.1,
      outputPerM: 0.5,
    });
  });
});
