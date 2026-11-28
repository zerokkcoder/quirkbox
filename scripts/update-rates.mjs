#!/usr/bin/env node
/**
 * Refresh public/data/rates.json from open, keyless upstreams.
 *
 *   npm run rates:update           # write the file
 *   npm run rates:update -- --dry-run  # print the diff only
 *
 * Sources:
 * - Models.dev  https://models.dev/api.json  (per-1M-token USD prices, release dates)
 * - Frankfurter https://api.frankfurter.dev  (ECB-backed USD→CNY reference rate)
 *
 * Manual annotations in rates.json (CNY peak prices, promoUntil + regular
 * prices, source/confidence) are preserved by the pure logic in
 * update-rates-lib.mjs. Fetch failures never overwrite a good file.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mergeRates, validateRates } from "./update-rates-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(here, "../public/data/rates.json");
const modelsUrl = "https://models.dev/api.json";
const fxUrl = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY";
const dryRun = process.argv.includes("--dry-run");

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.json();
}

async function fetchFx() {
  try {
    const payload = await getJson(fxUrl);
    const rate = payload?.rates?.CNY;
    if (typeof rate !== "number" || rate <= 0) throw new Error("missing CNY rate");
    return { rate, date: payload.date };
  } catch (error) {
    console.warn(`  ! fx fetch failed: ${error.message}`);
    return null;
  }
}

async function fetchModels() {
  try {
    const payload = await getJson(modelsUrl);
    if (!payload || typeof payload !== "object") throw new Error("empty payload");
    return payload;
  } catch (error) {
    console.warn(`  ! models.dev fetch failed: ${error.message}`);
    return null;
  }
}

async function main() {
  const current = JSON.parse(await readFile(dataFile, "utf8"));
  console.log("Fetching upstream rates…");
  const [upstream, fx] = await Promise.all([fetchModels(), fetchFx()]);

  const now = new Date();
  const merged = mergeRates({ current, upstream, fx, now });
  const errors = validateRates(merged.data);
  if (errors.length > 0) {
    console.error("Refusing to write — validation failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nChanges (${merged.changes.length}):`);
  for (const change of merged.changes) console.log(`  ${change}`);
  for (const warning of merged.warnings) console.warn(`  ! ${warning}`);
  if (merged.changes.length === 0 && merged.warnings.length === 0) {
    console.log("  (no changes)");
  }
  console.log(
    `\nModels: ${current.llmPricing.length} → ${merged.data.llmPricing.length}` +
      ` | USD→CNY: ${current.meta.exchangeRate} → ${merged.data.meta.exchangeRate}`
  );

  if (dryRun) {
    console.log("\nDry run — file not written.");
    return;
  }
  await writeFile(dataFile, `${JSON.stringify(merged.data, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${dataFile}`);
}

main().catch((error) => {
  console.error(`Unexpected failure: ${error.message}`);
  process.exitCode = 1;
});
