import { effectivePrice, isPromoActive } from "./rates";
import type { LlmPrice } from "./types";

/** Fallback only — the UI always lets the user type the current rate. */
export const DEFAULT_USD_TO_CNY = 7.1;

/**
 * Typical LLM calls consume far more input than output. A 3:1 blend is the
 * industry-standard way to collapse two unit prices into one comparable
 * number; it is shown next to the raw prices so the assumption stays visible.
 */
const INPUT_WEIGHT = 3;
const OUTPUT_WEIGHT = 1;

export type PriceComparison = {
  key: string;
  vendor: string;
  model: string;
  currency: "USD" | "CNY";
  inputPerM: number;
  outputPerM: number;
  inputUsd: number;
  outputUsd: number;
  blendedUsd: number;
  promo: boolean;
  promoUntil?: string;
  isLowest: boolean;
};

export function normalizeRate(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_USD_TO_CNY;
  return value;
}

export function toUsd(amount: number, currency: "USD" | "CNY", usdToCny: number): number {
  const rate = normalizeRate(usdToCny);
  return currency === "CNY" ? amount / rate : amount;
}

export function comparePrices(
  prices: LlmPrice[],
  usdToCny: number,
  now: Date = new Date()
): PriceComparison[] {
  const rows = prices.map((price): PriceComparison => {
    const effective = effectivePrice(price, now);
    const inputUsd = toUsd(effective.inputPerM, price.currency, usdToCny);
    const outputUsd = toUsd(effective.outputPerM, price.currency, usdToCny);
    return {
      key: `${price.vendor}|${price.model}`,
      vendor: price.vendor,
      model: price.model,
      currency: price.currency,
      inputPerM: effective.inputPerM,
      outputPerM: effective.outputPerM,
      inputUsd,
      outputUsd,
      blendedUsd:
        (inputUsd * INPUT_WEIGHT + outputUsd * OUTPUT_WEIGHT) /
        (INPUT_WEIGHT + OUTPUT_WEIGHT),
      promo: isPromoActive(price, now),
      promoUntil: price.promoUntil,
      isLowest: false,
    };
  });

  rows.sort((a, b) => a.blendedUsd - b.blendedUsd);
  if (rows.length > 0) {
    const lowest = rows[0].blendedUsd;
    for (const row of rows) {
      row.isLowest = Math.abs(row.blendedUsd - lowest) < 1e-9;
    }
  }
  return rows;
}

/**
 * Re-flag the lowest price within a visible subset. comparePrices marks the
 * cheapest of ALL models, but the UI highlights only the ones the visitor
 * selected — without this the highlight can point at a hidden model.
 */
export function markLowest(rows: PriceComparison[]): PriceComparison[] {
  if (rows.length === 0) return rows;
  const lowest = Math.min(...rows.map((row) => row.blendedUsd));
  return rows.map((row) => ({
    ...row,
    isLowest: Math.abs(row.blendedUsd - lowest) < 1e-9,
  }));
}
