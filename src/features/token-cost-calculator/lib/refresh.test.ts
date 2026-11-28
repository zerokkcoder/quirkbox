import { describe, expect, it } from "vitest";
import {
  applyUpstreamPrices,
  discoverFlagships,
  mergeRates,
  validateRates,
} from "../../../../scripts/update-rates-lib.mjs";

const upstream = {
  openai: {
    name: "OpenAI",
    models: {
      "gpt-6.2-astra": {
        name: "GPT-6.2 Astra",
        cost: { input: 8, output: 40 },
        release_date: "2026-11-17",
      },
      "gpt-6.3-astra": {
        name: "GPT-6.3 Astra",
        cost: { input: 9, output: 45 },
        release_date: "2026-11-27",
      },
      "gpt-6.3-astra-healthcare": {
        name: "GPT-6.3 Astra Healthcare",
        cost: { input: 10, output: 50 },
        release_date: "2026-11-28",
      },
    },
  },
  deepseek: {
    name: "DeepSeek",
    models: {
      "deepseek-v4-flash": {
        name: "DeepSeek V4 Flash",
        cost: { input: 0.15, output: 0.6 },
        release_date: "2026-10-17",
      },
    },
  },
};

const current = {
  meta: { updatedAt: "2026-11-28", exchangeRate: 7.1 },
  llmPricing: [
    {
      vendor: "OpenAI",
      model: "GPT-6.2 Astra",
      inputPerM: 8,
      outputPerM: 40,
      currency: "USD",
      confidence: "medium",
    },
    {
      vendor: "DeepSeek",
      model: "V4-Flash (peak)",
      inputPerM: 3,
      outputPerM: 9,
      currency: "CNY",
      confidence: "medium",
    },
  ],
};

describe("applyUpstreamPrices", () => {
  it("refreshes USD prices from upstream and records the source", () => {
    const stale = [
      { ...current.llmPricing[0], inputPerM: 6, outputPerM: 30 },
      current.llmPricing[1],
    ];
    const result = applyUpstreamPrices(stale, upstream);
    const astra = result.prices.find((row: { model: string }) => row.model === "GPT-6.2 Astra");
    expect(astra.inputPerM).toBe(8);
    expect(astra.source).toContain("models.dev");
    expect(result.changes.some((change: string) => change.includes("GPT-6.2 Astra"))).toBe(true);
  });

  it("keeps manual CNY peak prices intact", () => {
    const result = applyUpstreamPrices(current.llmPricing, upstream);
    const flash = result.prices.find((row: { model: string }) => row.model === "V4-Flash (peak)");
    expect(flash.inputPerM).toBe(3);
    expect(flash.outputPerM).toBe(9);
    expect(flash.currency).toBe("CNY");
  });

  it("keeps prices unchanged when upstream has no matching alias", () => {
    const result = applyUpstreamPrices(current.llmPricing, {});
    expect(result.prices).toEqual(current.llmPricing);
    expect(result.changes).toEqual([]);
  });

  it("ignores a zero upstream price (subscription, not free)", () => {
    const zeroed = {
      openai: {
        models: {
          "gpt-6.2-astra": { cost: { input: 0, output: 0 }, release_date: "2026-11-17" },
        },
      },
    };
    const result = applyUpstreamPrices(current.llmPricing, zeroed);
    expect(result.prices[0].inputPerM).toBe(8);
    expect(result.changes).toEqual([]);
  });

  it("stamps the upstream source even when the price has not moved", () => {
    const result = applyUpstreamPrices(current.llmPricing, upstream);
    const astra = result.prices.find((row: { model: string }) => row.model === "GPT-6.2 Astra");
    expect(astra.source).toContain("models.dev");
    expect(result.changes).toEqual([]);
  });
});

describe("discoverFlagships", () => {
  it("adds the newest non-variant flagship per provider", () => {
    const additions = discoverFlagships(upstream, current.llmPricing);
    expect(additions).toHaveLength(1);
    expect(additions[0].model).toBe("GPT-6.3 Astra");
    expect(additions[0].currency).toBe("USD");
    expect(additions[0].confidence).toBe("low");
  });

  it("skips models already present and variant suffixes", () => {
    const additions = discoverFlagships(upstream, [
      ...current.llmPricing,
      { vendor: "OpenAI", model: "GPT-6.3 Astra", inputPerM: 9, outputPerM: 45, currency: "USD" },
    ]);
    expect(additions).toEqual([]);
  });
});

describe("mergeRates", () => {
  it("writes the fetched exchange rate with its date into meta", () => {
    const merged = mergeRates({
      current,
      upstream,
      fx: { rate: 6.6544, date: "2026-11-27" },
      now: new Date("2026-11-28T12:00:00Z"),
    });
    expect(merged.data.meta.exchangeRate).toBe(6.6544);
    expect(merged.data.meta.fxDate).toBe("2026-11-27");
    expect(merged.data.meta.updatedAt).toBe("2026-11-28");
    expect(merged.data.llmPricing.length).toBeGreaterThan(current.llmPricing.length);
  });

  it("keeps the previous exchange rate when the fetch fails", () => {
    const merged = mergeRates({ current, upstream, fx: null, now: new Date() });
    expect(merged.data.meta.exchangeRate).toBe(7.1);
    expect(merged.warnings.some((warning: string) => warning.includes("fx"))).toBe(true);
  });
});

describe("validateRates", () => {
  it("rejects a non-positive exchange rate", () => {
    const errors = validateRates({ ...current, meta: { ...current.meta, exchangeRate: 0 } });
    expect(errors.some((error: string) => error.includes("exchangeRate"))).toBe(true);
  });

  it("rejects a promo without regular fallback prices", () => {
    const errors = validateRates({
      ...current,
      llmPricing: [
        {
          vendor: "Google",
          model: "Gemini 4 Argon",
          inputPerM: 2,
          outputPerM: 10,
          currency: "USD",
          promoUntil: "2026-12-31",
        },
      ],
    });
    expect(errors.some((error: string) => error.includes("regular"))).toBe(true);
  });

  it("accepts the current rate file", () => {
    expect(validateRates(current)).toEqual([]);
  });
});
