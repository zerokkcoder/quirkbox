import type { LlmPrice, RatesData } from "./types";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePrice(entry: unknown): LlmPrice | null {
  if (!isPlainObject(entry)) return null;
  if (typeof entry.model !== "string" || !entry.model) return null;
  if (!isNonNegativeNumber(entry.inputPerM) || !isNonNegativeNumber(entry.outputPerM)) {
    return null;
  }
  if (entry.currency !== undefined && entry.currency !== "USD" && entry.currency !== "CNY") {
    return null;
  }

  const price: LlmPrice = {
    vendor: typeof entry.vendor === "string" ? entry.vendor : "",
    model: entry.model,
    inputPerM: entry.inputPerM,
    outputPerM: entry.outputPerM,
    currency: entry.currency === "CNY" ? "CNY" : "USD",
  };
  if (typeof entry.promoUntil === "string") price.promoUntil = entry.promoUntil;
  if (isNonNegativeNumber(entry.regularInputPerM)) {
    price.regularInputPerM = entry.regularInputPerM;
  }
  if (isNonNegativeNumber(entry.regularOutputPerM)) {
    price.regularOutputPerM = entry.regularOutputPerM;
  }
  if (typeof entry.source === "string") price.source = entry.source;
  if (
    entry.confidence === "official" ||
    entry.confidence === "medium" ||
    entry.confidence === "low"
  ) {
    price.confidence = entry.confidence;
  }
  return price;
}

/**
 * Validates an untrusted rates payload (fetched JSON or built-in fallback).
 * Invalid model entries are dropped rather than rejecting the whole file, so
 * one bad row cannot take every price offline.
 */
export function parseRates(input: unknown): RatesData | null {
  if (!isPlainObject(input)) return null;
  if (!isPlainObject(input.meta) || typeof input.meta.updatedAt !== "string") return null;
  if (!Array.isArray(input.llmPricing)) return null;

  const llmPricing = input.llmPricing
    .map(parsePrice)
    .filter((price): price is LlmPrice => price !== null);

  // A rates file with no usable prices is not useful data — treat it as invalid.
  if (input.llmPricing.length > 0 && llmPricing.length === 0) return null;

  return {
    meta: {
      updatedAt: input.meta.updatedAt,
      note: typeof input.meta.note === "string" ? input.meta.note : undefined,
      ...(isNonNegativeNumber(input.meta.exchangeRate) && input.meta.exchangeRate > 0
        ? { exchangeRate: input.meta.exchangeRate }
        : {}),
      ...(typeof input.meta.fxDate === "string" ? { fxDate: input.meta.fxDate } : {}),
      ...(typeof input.meta.fxSource === "string" ? { fxSource: input.meta.fxSource } : {}),
    },
    llmPricing,
  };
}

/**
 * A promotion applies through its promoUntil date inclusive. Once it expires,
 * fall back to the regular price when present; otherwise keep the base price.
 */
export function effectivePrice(price: LlmPrice, now: Date) {
  if (price.promoUntil) {
    const expires = new Date(`${price.promoUntil}T23:59:59Z`);
    if (now.getTime() > expires.getTime()) {
      return {
        inputPerM: price.regularInputPerM ?? price.inputPerM,
        outputPerM: price.regularOutputPerM ?? price.outputPerM,
      };
    }
  }
  return { inputPerM: price.inputPerM, outputPerM: price.outputPerM };
}

export function isPromoActive(price: LlmPrice, now: Date = new Date()): boolean {
  if (!price.promoUntil) return false;
  const expires = new Date(`${price.promoUntil}T23:59:59Z`);
  return now.getTime() <= expires.getTime();
}
