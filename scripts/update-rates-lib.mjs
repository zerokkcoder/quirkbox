/**
 * Pure helpers for refreshing public/data/rates.json from open upstreams.
 * No I/O here — the CLI in update-rates.mjs owns fetching and writing.
 *
 * Design rules:
 * - USD prices can be refreshed from Models.dev; CNY prices are manual
 *   (peak/off-peak windows differ from the upstream's single USD number).
 * - Promotions and their regular fallback prices are manual annotations.
 * - New models are discovered but limited to one flagship per whitelisted
 *   vendor, so the comparison UI never turns into a 137-item checkbox list.
 */

export const PROVIDERS = {
  openai: { vendor: "OpenAI", prefix: /^gpt-\d/ },
  anthropic: { vendor: "Anthropic", prefix: /^claude-/ },
  google: { vendor: "Google", prefix: /^gemini-\d/ },
  deepseek: { vendor: "DeepSeek", prefix: /^deepseek-v\d/ },
  alibaba: { vendor: "Alibaba", prefix: /^qwen\d/ },
  volcengine: { vendor: "ByteDance", prefix: /^doubao-/ },
};

/** Display name in rates.json → model id in models.dev/api.json. */
export const ALIASES = {
  "GPT-6.2 Astra": "gpt-6.2-astra",
  "GPT-6.2 Sol": "gpt-6.2-sol",
  "GPT-6.1 Terra": "gpt-6.1-terra",
  "GPT-6 Luna": "gpt-6-luna",
  "Claude Fable 5.2": "claude-fable-5-2",
  "Claude Opus 5.5": "claude-opus-5-5",
  "Claude Sonnet 5.5": "claude-sonnet-5-5",
  "Claude Haiku 5.5": "claude-haiku-5-5",
  "Gemini 4 Argon": "gemini-4-argon",
  "Gemini 3.8 Flash": "gemini-3.8-flash",
  "Gemini 3.1 Flash-Lite": "gemini-3.1-flash-lite",
  "V4-Flash (peak)": "deepseek-v4-flash",
  "V4-Pro (peak)": "deepseek-v4-pro",
  "Qwen4-max": "qwen4-max",
  "Qwen3.8-flash": "qwen3.8-flash",
  "Qwen3.7-max (intl)": "qwen3.7-max",
  "Doubao Seed-Evolving": "doubao-seed-evolving",
  "Doubao 2.1 Pro": "doubao-seed-2.1-pro",
  "Doubao 2.1 Turbo": "doubao-seed-2.1-turbo",
};

/** Variants that are not general-purpose flagships. */
const VARIANT = /healthcare|vision|image|research|exp|preview|live|audio|tts|embedding|ocr|character|code|lite|mini|nano|omni/i;

/**
 * True when `candidate` is just an older numbered version of a series that is
 * already present (e.g. Fable 5.1 when Fable 5.2 is already tracked).
 */
/** First version number in a slug: "claude-opus-4-5-20251101" → 4.5. */
function versionOf(slug) {
  const parts = slug.match(/\d+/g);
  if (!parts?.length) return 0;
  const major = Number(parts[0]);
  const minor = parts[1] && parts[1].length <= 2 ? Number(parts[1]) : 0;
  return Number.isFinite(major) ? major + minor / 100 : 0;
}

function isOlderSibling(candidateId, knownIds) {
  // Family = the leading non-numeric tokens, e.g. "claude-fable" or "gpt".
  const family = candidateId.match(/^[a-z]+(?:-[a-z]+)*/i)?.[0]?.toLowerCase() ?? "";
  if (!family) return false;
  const candidateVersion = versionOf(candidateId);
  for (const id of knownIds) {
    if (!id || id === candidateId) continue;
    const knownFamily = id.match(/^[a-z]+(?:-[a-z]+)*/i)?.[0]?.toLowerCase() ?? "";
    if (knownFamily !== family) continue;
    if (versionOf(id) >= candidateVersion) return true;
  }
  return false;
}

function upstreamIndex(upstream) {
  const index = new Map();
  for (const [providerId, provider] of Object.entries(upstream ?? {})) {
    for (const [id, model] of Object.entries(provider?.models ?? {})) {
      index.set(id, { providerId, provider, model, id });
    }
  }
  return index;
}

/**
 * Refresh USD prices from upstream. CNY rows and promotional annotations are
 * never overwritten — those encode peak/off-peak and expiry decisions that
 * the upstream does not publish.
 */
export function applyUpstreamPrices(prices, upstream) {
  const index = upstreamIndex(upstream);
  const changes = [];
  const updated = prices.map((price) => {
    if (price.currency !== "USD") return price;
    const id = ALIASES[price.model];
    if (!id) return price;
    const hit = index.get(id);
    if (!hit) return price;
    const input = hit.model?.cost?.input;
    const output = hit.model?.cost?.output;
    // Zero means "included in a subscription" upstream, not a real free tier.
    if (typeof input !== "number" || typeof output !== "number" || input <= 0 || output <= 0) {
      return price;
    }

    const changed = input !== price.inputPerM || output !== price.outputPerM;
    if (changed) {
      changes.push(`${price.model}: ${price.inputPerM}/${price.outputPerM} → ${input}/${output}`);
    }
    // Always stamp the source, even when the price is unchanged: that proves
    // the entry was checked against upstream on this refresh.
    return {
      ...price,
      inputPerM: input,
      outputPerM: output,
      source: `models.dev/${hit.providerId}/${id}`,
      confidence: "medium",
    };
  });

  return { prices: updated, changes };
}

/**
 * Add at most one newest general-purpose flagship per whitelisted vendor.
 * Models already present by display name or alias are skipped.
 */
export function discoverFlagships(upstream, prices) {
  const knownNames = new Set(prices.map((price) => price.model));
  const knownIds = new Set(
    prices.map((price) => ALIASES[price.model]).filter((id) => typeof id === "string")
  );
  const additions = [];

  for (const [providerId, rule] of Object.entries(PROVIDERS)) {
    const provider = upstream?.[providerId];
    if (!provider?.models) continue;

    const candidates = Object.entries(provider.models)
      .filter(([id, model]) => {
        if (!rule.prefix.test(id)) return false;
        if (VARIANT.test(id) || VARIANT.test(model?.name ?? "")) return false;
        if (knownIds.has(id) || knownNames.has(model?.name)) return false;
        if (isOlderSibling(id, knownIds)) return false;
        // A zero price means "included in a subscription", not free — skip it.
        return typeof model?.cost?.input === "number" && model.cost.input > 0 &&
          typeof model?.cost?.output === "number" && model.cost.output > 0;
      })
      .sort((a, b) => String(b[1]?.release_date ?? "").localeCompare(String(a[1]?.release_date ?? "")));

    if (candidates.length === 0) continue;
    const [id, model] = candidates[0];
    additions.push({
      vendor: rule.vendor,
      model: model.name || id,
      inputPerM: model.cost.input,
      outputPerM: model.cost.output,
      currency: "USD",
      source: `models.dev/${providerId}/${id}`,
      confidence: "low",
    });
  }

  return additions;
}

function dayKey(now) {
  return now.toISOString().slice(0, 10);
}

/** Combine refreshed prices, discovered models and the fetched FX rate. */
export function mergeRates({ current, upstream, fx, now }) {
  const warnings = [];
  const refreshed = applyUpstreamPrices(current.llmPricing, upstream);
  const additions = discoverFlagships(upstream, refreshed.prices);
  const prices = [...refreshed.prices, ...additions];

  let exchangeRate = current.meta.exchangeRate;
  let fxDate = current.meta.fxDate;
  let fxSource = current.meta.fxSource;
  if (fx && typeof fx.rate === "number" && fx.rate > 0) {
    exchangeRate = fx.rate;
    fxDate = fx.date;
    fxSource = "https://api.frankfurter.dev (ECB reference rate)";
  } else {
    warnings.push("fx fetch failed or invalid — keeping previous exchangeRate");
  }
  if (!upstream || Object.keys(upstream).length === 0) {
    warnings.push("models.dev fetch failed — keeping all previous prices");
  }

  return {
    data: {
      meta: {
        ...current.meta,
        updatedAt: dayKey(now),
        exchangeRate,
        ...(fxDate ? { fxDate } : {}),
        ...(fxSource ? { fxSource } : {}),
      },
      llmPricing: prices,
    },
    changes: [...refreshed.changes, ...additions.map((row) => `+ ${row.model}`)],
    warnings,
  };
}

/** Fail closed: never write an invalid rates file over a good one. */
export function validateRates(data) {
  const errors = [];
  const rate = data?.meta?.exchangeRate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    errors.push("meta.exchangeRate must be a positive number");
  }
  if (typeof data?.meta?.updatedAt !== "string") {
    errors.push("meta.updatedAt must be a string");
  }
  if (!Array.isArray(data?.llmPricing) || data.llmPricing.length === 0) {
    errors.push("llmPricing must contain at least one model");
  }
  const seen = new Set();
  for (const price of data?.llmPricing ?? []) {
    const key = `${price.vendor}|${price.model}`;
    if (seen.has(key)) errors.push(`duplicate model: ${key}`);
    seen.add(key);
    for (const field of ["inputPerM", "outputPerM"]) {
      if (typeof price[field] !== "number" || !Number.isFinite(price[field]) || price[field] < 0) {
        errors.push(`${key}.${field} must be a non-negative number`);
      }
    }
    if (price.currency !== "USD" && price.currency !== "CNY") {
      errors.push(`${key}.currency must be USD or CNY`);
    }
    if (
      price.promoUntil &&
      (typeof price.regularInputPerM !== "number" || typeof price.regularOutputPerM !== "number")
    ) {
      errors.push(`${key}: promoUntil requires regular fallback prices`);
    }
  }
  return errors;
}
