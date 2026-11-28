import { describe, expect, it } from "vitest";
import {
  DEFAULT_USD_TO_CNY,
  comparePrices,
  markLowest,
  normalizeRate,
  toUsd,
} from "./compare";
import type { LlmPrice } from "./types";

const usd: LlmPrice = {
  vendor: "OpenAI",
  model: "GPT-6.2 Sol",
  inputPerM: 2,
  outputPerM: 10,
  currency: "USD",
};

const cny: LlmPrice = {
  vendor: "Alibaba",
  model: "Qwen3.8-flash",
  inputPerM: 0.8,
  outputPerM: 2.7,
  currency: "CNY",
};

const cheap: LlmPrice = {
  vendor: "OpenAI",
  model: "GPT-6 Luna",
  inputPerM: 0.1,
  outputPerM: 0.5,
  currency: "USD",
};

const promo: LlmPrice = {
  vendor: "Google",
  model: "Gemini 4 Argon",
  inputPerM: 2,
  outputPerM: 10,
  currency: "USD",
  promoUntil: "2026-11-30",
  regularInputPerM: 4,
  regularOutputPerM: 20,
};

describe("markLowest", () => {
  it("marks the cheapest row within the visible subset only", () => {
    const all = comparePrices([cheap, usd, cny], 7.1);
    const subset = [all[1], all[2]]; // hide the globally cheapest model
    const marked = markLowest(subset);
    expect(marked.some((row) => row.isLowest)).toBe(true);
    const cheapestVisible = Math.min(...subset.map((row) => row.blendedUsd));
    expect(marked.find((row) => row.isLowest)?.blendedUsd).toBeCloseTo(cheapestVisible, 10);
  });

  it("marks every tied cheapest row", () => {
    const all = comparePrices(
      [
        { ...usd, model: "A", inputPerM: 1, outputPerM: 4 },
        { ...usd, model: "B", inputPerM: 1, outputPerM: 4 },
        usd,
      ],
      7.1
    );
    const marked = markLowest(all);
    expect(marked.filter((row) => row.isLowest)).toHaveLength(2);
  });
});

describe("normalizeRate", () => {
  it("keeps a valid positive rate", () => {
    expect(normalizeRate(7.3)).toBe(7.3);
  });

  it("falls back to the default for zero, negative, NaN and Infinity", () => {
    expect(normalizeRate(0)).toBe(DEFAULT_USD_TO_CNY);
    expect(normalizeRate(-1)).toBe(DEFAULT_USD_TO_CNY);
    expect(normalizeRate(Number.NaN)).toBe(DEFAULT_USD_TO_CNY);
    expect(normalizeRate(Number.POSITIVE_INFINITY)).toBe(DEFAULT_USD_TO_CNY);
  });
});

describe("toUsd", () => {
  it("passes USD through unchanged", () => {
    expect(toUsd(2, "USD", 7.1)).toBe(2);
  });

  it("divides CNY by the rate", () => {
    // 7.1 CNY = 1 USD, so 7.1 CNY -> 1 USD.
    expect(toUsd(7.1, "CNY", 7.1)).toBeCloseTo(1, 10);
    expect(toUsd(3, "CNY", 7.1)).toBeCloseTo(3 / 7.1, 10);
  });
});

describe("comparePrices", () => {
  const now = new Date("2026-11-28T00:00:00Z");

  it("uses a 3:1 input/output blend to produce one comparable number", () => {
    // (3 * 2 + 10) / 4 = 4 USD per 1M blended tokens.
    const rows = comparePrices([usd], 7.1, now);
    expect(rows[0].blendedUsd).toBeCloseTo(4, 10);
  });

  it("converts CNY prices before blending so cross-currency ranks are meaningful", () => {
    // 0.8/7.1 in, 2.7/7.1 out -> (3 * 0.112676 + 0.380282) / 4 = 0.179577.
    const rows = comparePrices([cny], 7.1, now);
    expect(rows[0].inputUsd).toBeCloseTo(0.8 / 7.1, 10);
    expect(rows[0].outputUsd).toBeCloseTo(2.7 / 7.1, 10);
    expect(rows[0].blendedUsd).toBeCloseTo(0.1795774648, 8);
  });

  it("re-ranks when the exchange rate changes", () => {
    const at71 = comparePrices([usd, cny], 7.1, now);
    const at10 = comparePrices([usd, cny], 10, now);
    // At 7.1 the CNY model is cheaper; at 10 it is cheaper still.
    expect(at71[0].model).toBe("Qwen3.8-flash");
    expect(at10[0].model).toBe("Qwen3.8-flash");
    expect(at10[0].blendedUsd).toBeCloseTo(0.1275, 10);
    expect(at10[0].blendedUsd).toBeLessThan(at71[0].blendedUsd);
  });

  it("sorts ascending and marks every model tied for the minimum", () => {
    const tied: LlmPrice = {
      vendor: "Anthropic",
      model: "Claude Haiku 5.5",
      inputPerM: 0.1,
      outputPerM: 0.5,
      currency: "USD",
    };
    const rows = comparePrices([usd, tied, cheap], 7.1, now);
    // Stable sort preserves input order for ties.
    expect(rows.map((row) => row.model)).toEqual([
      "Claude Haiku 5.5",
      "GPT-6 Luna",
      "GPT-6.2 Sol",
    ]);
    expect(rows[0].isLowest).toBe(true);
    expect(rows[1].isLowest).toBe(true);
    expect(rows[2].isLowest).toBe(false);
  });

  it("uses regular prices once a promotion expires", () => {
    const before = comparePrices([promo], 7.1, new Date("2026-11-30T23:59:59Z"));
    const after = comparePrices([promo], 7.1, new Date("2026-12-01T00:00:00Z"));
    // Promo (3 * 2 + 10) / 4 = 4; regular (3 * 4 + 20) / 4 = 8.
    expect(before[0].blendedUsd).toBeCloseTo(4, 10);
    expect(before[0].promo).toBe(true);
    expect(after[0].blendedUsd).toBeCloseTo(8, 10);
    expect(after[0].promo).toBe(false);
  });

  it("returns an empty list for no prices", () => {
    expect(comparePrices([], 7.1, now)).toEqual([]);
  });

  it("uses a stable vendor|model key for selection", () => {
    const rows = comparePrices([usd, cny], 7.1, now);
    expect(rows.map((row) => row.key)).toEqual([
      "Alibaba|Qwen3.8-flash",
      "OpenAI|GPT-6.2 Sol",
    ]);
  });
});
