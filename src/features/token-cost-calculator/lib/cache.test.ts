import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearRatesCache, loadRates, readRatesCache, writeRatesCache } from "./cache";
import { parseRates } from "./rates";
import type { RatesData } from "./types";

const rates = parseRates({
  meta: { updatedAt: "2026-11-28" },
  llmPricing: [{ model: "GPT-6 Luna", inputPerM: 0.1, outputPerM: 0.5, currency: "USD" }],
}) as RatesData;

const today = "2026-11-28";

function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
  return store;
}

describe("rates cache", () => {
  beforeEach(() => {
    stubStorage();
  });

  it("ignores an empty cache", () => {
    expect(readRatesCache(today)).toBeNull();
  });

  it("returns the cached rates when the stored date matches today", () => {
    writeRatesCache(rates, today);
    expect(readRatesCache(today)?.meta.updatedAt).toBe("2026-11-28");
  });

  it("discards a cache written on a previous day", () => {
    writeRatesCache(rates, "2026-11-27");
    expect(readRatesCache(today)).toBeNull();
  });

  it("never returns malformed cached JSON", () => {
    const store = stubStorage();
    store.set("starrudder:rates-cache", "{not json");
    expect(readRatesCache(today)).toBeNull();
  });

  it("clears the cache key", () => {
    writeRatesCache(rates, today);
    clearRatesCache();
    expect(readRatesCache(today)).toBeNull();
  });
});

describe("loadRates", () => {
  beforeEach(() => {
    stubStorage();
  });

  it("does not fetch when today's cache is present", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    writeRatesCache(rates, today);

    const result = await loadRates({ today, fetchMock });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("cache");
    expect(result.data?.meta.updatedAt).toBe("2026-11-28");
  });

  it("fetches and caches once when the cache is stale", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        meta: { updatedAt: "2026-11-30" },
        llmPricing: [{ model: "New Model", inputPerM: 1, outputPerM: 2 }],
      }),
    });
    writeRatesCache(rates, "2026-11-27");

    const result = await loadRates({ today, fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("network");
    expect(result.data?.llmPricing[0].model).toBe("New Model");
    expect(readRatesCache(today)?.meta.updatedAt).toBe("2026-11-30");
  });

  it("falls back to bundled rates when the fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));

    const result = await loadRates({ today, fetchMock });

    expect(result.source).toBe("fallback");
    expect(result.data?.llmPricing.length).toBeGreaterThan(0);
  });

  it("uses a stale cache rather than nothing when the fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    writeRatesCache(rates, "2026-11-27");

    const result = await loadRates({ today, fetchMock });

    expect(result.source).toBe("stale");
    expect(result.data?.meta.updatedAt).toBe("2026-11-28");
  });
});
