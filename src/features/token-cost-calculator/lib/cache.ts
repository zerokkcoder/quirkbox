import { parseRates } from "./rates";
import type { RatesData } from "./types";

/**
 * Public rate tables are site configuration, not user data, so caching them in
 * localStorage does not touch the "nothing saved" promise. Only the rates and
 * the fetch date are stored — never a user's prompt or computed result.
 */
const CACHE_KEY = "starrudder:rates-cache";

/** Bundled safety net: used only when the fetch AND any cached copy both fail. */
const FALLBACK_RATES: RatesData = {
  meta: { updatedAt: "2026-11-28", note: "Offline defaults" },
  llmPricing: [
    {
      vendor: "OpenAI",
      model: "GPT-6 Luna",
      inputPerM: 0.1,
      outputPerM: 0.5,
      currency: "USD",
      confidence: "low",
    },
    {
      vendor: "Anthropic",
      model: "Claude Haiku 5.5",
      inputPerM: 0.1,
      outputPerM: 0.5,
      currency: "USD",
      confidence: "low",
    },
  ],
};

export type LoadRatesResult = {
  data: RatesData | null;
  source: "cache" | "network" | "stale" | "fallback";
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readRatesCache(today: string): RatesData | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { date?: unknown; data?: unknown };
    if (parsed.date !== today) return null;
    return parseRates(parsed.data);
  } catch {
    return null;
  }
}

export function writeRatesCache(data: RatesData, today: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data }));
  } catch {
    // Quota or privacy mode: caching is best-effort, never a failure.
  }
}

export function clearRatesCache(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // Best-effort.
  }
}

/**
 * Load once per local day: a same-day cache short-circuits the network.
 * A stale cache is still preferable to the tiny bundled fallback when the
 * fetch fails, because it carries the full model list.
 */
export async function loadRates({
  today,
  fetchMock,
}: {
  today: string;
  fetchMock?: typeof fetch;
}): Promise<LoadRatesResult> {
  const fresh = readRatesCache(today);
  if (fresh) return { data: fresh, source: "cache" };

  let stale: RatesData | null = null;
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: unknown };
        stale = parseRates(parsed.data);
      }
    } catch {
      stale = null;
    }
  }

  try {
    const doFetch = fetchMock ?? fetch;
    const response = await doFetch("/data/rates.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseRates(await response.json());
    if (!parsed || parsed.llmPricing.length === 0) throw new Error("Invalid rates");

    writeRatesCache(parsed, today);
    return { data: parsed, source: "network" };
  } catch {
    if (stale) return { data: stale, source: "stale" };
    return { data: FALLBACK_RATES, source: "fallback" };
  }
}
