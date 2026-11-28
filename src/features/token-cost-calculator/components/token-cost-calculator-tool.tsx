"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InfoIcon } from "lucide-react";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig, type Locale } from "@/config/site";
import { loadRates } from "@/features/token-cost-calculator/lib/cache";
import { comparePrices, DEFAULT_USD_TO_CNY, markLowest, normalizeRate } from "@/features/token-cost-calculator/lib/compare";
import type { PriceComparison } from "@/features/token-cost-calculator/lib/compare";
import type { RatesData } from "@/features/token-cost-calculator/lib/types";
import { localizePath } from "@/i18n/navigation";
import { getMessages, type Messages } from "@/lib/i18n";

const staleAfterDays = 30;
const defaultSelectionSize = 6;

const path = "/tools/token-cost-calculator";

function localDateKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysSince(dateKey: string, now: Date): number {
  const then = new Date(`${dateKey}T00:00:00`).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

function money(value: number, currency: "USD" | "CNY"): string {
  const symbol = currency === "CNY" ? "¥" : "$";
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return `${symbol}${value.toFixed(digits)}`;
}

export function TokenCostCalculatorTool({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Messages["tokenCostCalculator"];
}) {
  const [rates, setRates] = useState<RatesData | null>(null);
  const [source, setSource] = useState<"cache" | "network" | "stale" | "fallback" | "loading">(
    "loading"
  );
  const [selectedKeys, setSelectedKeys] = useState<string[] | null>(null);
  const [rateInput, setRateInput] = useState(String(DEFAULT_USD_TO_CNY));
  const rateTouched = useRef(false);
  const selectionRef = useRef<string[] | null>(null);
  const rateRef = useRef(DEFAULT_USD_TO_CNY);

  const shareLabels = getMessages(locale).share;
  const shareUrl = `${siteConfig.url}${localizePath(locale, path)}`;
  const usdToCny = normalizeRate(Number(rateInput));

  // Client-only: the rate file is public site config, never user data.
  useEffect(() => {
    let cancelled = false;
    loadRates({ today: localDateKey(new Date()) }).then((result) => {
      if (cancelled) return;
      setRates(result.data);
      setSource(result.source);
      // The JSON rate is the daily-refreshed default; never clobber a value
      // the visitor has already typed in this session.
      const fetchedRate = result.data?.meta.exchangeRate;
      if (!rateTouched.current && typeof fetchedRate === "number" && fetchedRate > 0) {
        rateRef.current = fetchedRate;
        setRateInput(String(fetchedRate));
      }
      // Async callback (not an effect body), so the React 19 lint rule permits it.
      // Keep the visitor's choice if they already interacted before load finished.
      if (selectionRef.current === null && result.data) {
        const effectiveRate =
          typeof fetchedRate === "number" && fetchedRate > 0 ? fetchedRate : rateRef.current;
        const ranking = comparePrices(result.data.llmPricing, effectiveRate, new Date());
        const defaults = ranking.slice(0, defaultSelectionSize).map((row) => row.key);
        selectionRef.current = defaults;
        setSelectedKeys(defaults);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const comparisons = useMemo<PriceComparison[]>(() => {
    if (!rates) return [];
    return comparePrices(rates.llmPricing, usdToCny, new Date());
  }, [rates, usdToCny]);

  const rows = markLowest(comparisons.filter((row) => selectedKeys?.includes(row.key) ?? false));
  const lowest = rows.find((row) => row.isLowest) ?? null;
  const isStale = rates ? daysSince(rates.meta.updatedAt, new Date()) > staleAfterDays : false;
  const rateNote =
    source === "fallback"
      ? labels.offlineDefaults
      : source === "stale"
        ? labels.staleCache
        : source === "cache"
          ? labels.cachedToday
          : "";

  // A visitor can click before the rate file arrives. Marking the ref here
  // stops the async default-selection from overwriting their choice.
  function applySelection(next: string[]) {
    selectionRef.current = next;
    setSelectedKeys(next);
  }

  function toggle(key: string) {
    const current = selectionRef.current ?? selectedKeys ?? [];
    applySelection(
      current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {labels.modelsLabel}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applySelection(comparisons.map((row) => row.key))}
              data-testid="tcc-select-all"
            >
              {labels.selectAll}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applySelection([])}
              data-testid="tcc-clear"
            >
              {labels.clearAll}
            </Button>
          </div>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3" data-testid="tcc-model-list">
          {comparisons.map((row) => {
            const checked = selectedKeys?.includes(row.key) ?? false;
            return (
              <label
                key={row.key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  checked
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(row.key)}
                  className="size-3.5 accent-primary"
                  data-testid={`tcc-check-${row.key.replace(/[^a-zA-Z0-9-]/g, "-")}`}
                />
                <span className="truncate">
                  {row.vendor} · {row.model}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tcc-rate" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {labels.rateLabel}
          </label>
          <Input
            id="tcc-rate"
            type="number"
            min={0.01}
            step={0.01}
            value={rateInput}
            onChange={(event) => {
              rateTouched.current = true;
              setRateInput(event.target.value);
            }}
            data-testid="tcc-rate"
          />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{labels.rateHint}</p>
      </div>

      {lowest ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3"
          data-testid="tcc-lowest"
        >
          <span className="text-sm font-semibold text-primary">{labels.lowestLabel}</span>
          <span className="font-mono text-lg font-semibold text-primary">
            {lowest.vendor} · {lowest.model} · {money(lowest.blendedUsd, "USD")}
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="tcc-results">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${
              row.isLowest ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card/60"
            }`}
            data-testid="tcc-card"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {row.vendor} · {row.model}
              </p>
              {row.isLowest ? (
                <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {labels.lowestBadge}
                </span>
              ) : null}
            </div>
            <dl className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{labels.inputLabel}</dt>
                <dd className="font-mono text-foreground">
                  {money(row.inputPerM, row.currency)}
                  {row.currency === "CNY" ? (
                    <span className="ml-1 text-muted-foreground">≈{money(row.inputUsd, "USD")}</span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{labels.outputLabel}</dt>
                <dd className="font-mono text-foreground">
                  {money(row.outputPerM, row.currency)}
                  {row.currency === "CNY" ? (
                    <span className="ml-1 text-muted-foreground">≈{money(row.outputUsd, "USD")}</span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-border/60 pt-1">
                <dt className="font-medium text-foreground">{labels.blendedLabel}</dt>
                <dd className="font-mono font-semibold text-primary">{money(row.blendedUsd, "USD")}</dd>
              </div>
            </dl>
            {row.promo && row.promoUntil ? (
              <p className="text-[11px] text-muted-foreground">
                {labels.promoNote.replace("{date}", row.promoUntil)}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="tcc-empty">
          {labels.noSelection}
        </p>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground" data-testid="tcc-blend-note">
        {labels.blendedNote}
      </p>

      {rateNote ? (
        <p className="flex items-start gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground" data-testid="tcc-rate-note">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          {rateNote}
        </p>
      ) : null}
      {isStale && rates ? (
        <p className="text-xs text-muted-foreground" data-testid="tcc-stale">
          {labels.staleData.replace("{date}", rates.meta.updatedAt)}
        </p>
      ) : null}
      {rates ? (
        <p className="text-xs text-muted-foreground" data-testid="tcc-updated">
          {labels.updatedAt.replace("{date}", rates.meta.updatedAt)}
        </p>
      ) : null}

      <section className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/40 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-primary">{labels.howItWorksTitle}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{labels.howItWorksBody}</p>
        <p className="text-xs text-muted-foreground">{labels.privacyNote}</p>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <ShareToXButton
          labels={shareLabels}
          tool="token-cost-calculator"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
      </div>
    </div>
  );
}
