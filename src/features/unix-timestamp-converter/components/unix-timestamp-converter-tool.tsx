"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ClockIcon, CopyIcon } from "lucide-react";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { TimezonePicker } from "@/features/unix-timestamp-converter/components/timezone-picker";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { siteConfig, type Locale } from "@/config/site";
import {
  codeSnippets,
  dayOfYear,
  formatZoned,
  isoString,
  isoWeek,
  relativeText,
  rfc1123,
  sqlString,
  unitValue,
  utcHuman,
  weekday,
} from "@/features/unix-timestamp-converter/lib/format";
import { interpretInput } from "@/features/unix-timestamp-converter/lib/parse";
import {
  eventMetadata,
  readInputFromLocation,
  writeInputToLocation,
} from "@/features/unix-timestamp-converter/lib/state";
import { resolveZone } from "@/features/unix-timestamp-converter/lib/timezones";
import {
  localZoneId,
  unitChoiceIds,
  type FormatRow,
  type UnitChoice,
} from "@/features/unix-timestamp-converter/lib/types";
import { localizePath } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { getMessages, type Messages } from "@/lib/i18n";

const feedbackDurationMs = 2600;
const relativeRefreshMs = 30_000;

const controlClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function ResultRow({
  row,
  copyLabel,
  onCopy,
}: {
  row: FormatRow;
  copyLabel: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2 sm:flex-row sm:items-center sm:gap-3"
      data-testid={`ts-row-${row.id}`}
    >
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase sm:w-36 sm:shrink-0">
        {row.label}
      </span>
      <code
        className="min-w-0 flex-1 font-mono text-sm break-all"
        data-testid={`ts-value-${row.id}`}
      >
        {row.value}
      </code>
      <Button
        variant="ghost"
        size="sm"
        aria-label={copyLabel}
        onClick={() => onCopy(row.value)}
        data-testid={`ts-copy-${row.id}`}
      >
        <CopyIcon />
      </Button>
    </div>
  );
}

export function UnixTimestampConverterTool({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Messages["unixTimestampConverter"];
}) {
  const [input, setInput] = useState("");
  const [unit, setUnit] = useState<UnitChoice>("auto");
  const [zone, setZone] = useState<string>(localZoneId);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number | null>(null);

  const displayLocale: "en" | "zh-Hant" = locale === "zh-Hant" ? "zh-Hant" : "en";
  const shareLabels = getMessages(locale).share;
  const shareUrl = `${siteConfig.url}${localizePath(
    locale,
    "/tools/unix-timestamp-converter"
  )}`;

  /**
   * The current time and the fragment are client-only. SSR renders the empty
   * state, so no Date.now()/location.hash value can differ between server and
   * client (ADR-0002 + the hydration rule from the password tool).
   */
  // Hydration constraint: location.hash and Date.now() are client-only, so SSR
  // must render the empty state rather than a value that differs on the client.
  useEffect(() => {
    const restored = readInputFromLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hash/clock, SSR renders empty state
    setInput(restored || String(Math.floor(Date.now() / 1000)));
    setNowMs(Date.now());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const value = readInputFromLocation();
      if (value) {
        setInput(value);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // replaceState, never pushState: typing must not add a history entry per key.
  // Gated on hydration so the initial empty render cannot overwrite the hash
  // that the first effect is about to restore.
  useEffect(() => {
    if (!hydrated) return;
    writeInputToLocation(input);
  }, [input, hydrated]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), relativeRefreshMs);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const result = useMemo(() => interpretInput(input, unit), [input, unit]);
  const view = result.ok ? result.view : null;

  const zoned = useMemo(() => {
    if (!view) {
      return null;
    }
    try {
      return formatZoned(view, resolveZone(zone), displayLocale);
    } catch {
      return null;
    }
  }, [view, zone, displayLocale]);

  const rows: FormatRow[] = view
    ? [
        { id: "utc", label: labels.rowNames.utc, value: utcHuman(view) },
        {
          id: "local",
          label: labels.rowNames.local,
          value: zoned
            ? `${zoned.text} ${zoned.offset} · ${resolveZone(zone)}`
            : labels.loading,
        },
        { id: "iso", label: labels.rowNames.iso, value: isoString(view) },
        {
          id: "seconds",
          label: labels.rowNames.seconds,
          value: unitValue(view, "seconds").toString(),
        },
        {
          id: "milliseconds",
          label: labels.rowNames.milliseconds,
          value: unitValue(view, "milliseconds").toString(),
        },
        {
          id: "relative",
          label: labels.rowNames.relative,
          value:
            nowMs === null
              ? labels.loading
              : relativeText(view, nowMs, displayLocale),
        },
      ]
    : [];

  const moreRows: FormatRow[] = view
    ? [
        { id: "rfc", label: labels.moreNames.rfc, value: rfc1123(view) },
        { id: "sql", label: labels.moreNames.sql, value: sqlString(view) },
        {
          id: "weekday",
          label: labels.moreNames.weekday,
          value: weekday(view, displayLocale),
        },
        {
          id: "weekNumber",
          label: labels.moreNames.weekNumber,
          value: String(isoWeek(view)),
        },
        {
          id: "dayOfYear",
          label: labels.moreNames.dayOfYear,
          value: String(dayOfYear(view)),
        },
        {
          id: "microseconds",
          label: labels.moreNames.microseconds,
          value: unitValue(view, "microseconds").toString(),
        },
        {
          id: "nanoseconds",
          label: labels.moreNames.nanoseconds,
          value: unitValue(view, "nanoseconds").toString(),
        },
      ]
    : [];

  const snippets = view ? codeSnippets(view) : [];
  const secondsValue = view ? unitValue(view, "seconds") : null;
  const show2038 =
    secondsValue === 2_147_483_647n || secondsValue === 2_147_483_648n;
  const showNegative = view ? view.epochMs < 0n : false;

  const detectedText = view
    ? view.source === "date"
      ? labels.detectedDateLabel
      : labels.detectedLabel.replace("{unit}", labels.unitNames[view.unit])
    : "";

  const errorText = result.ok
    ? ""
    : result.code === "empty"
      ? labels.errorEmpty
      : result.code === "invalid"
        ? labels.errorInvalid
        : labels.errorOutOfRange;

  function showFeedback(message: string) {
    setFeedback(message);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setFeedback("");
      timerRef.current = null;
    }, feedbackDurationMs);
  }

  async function copyValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(labels.copied);
      // Metadata is a whitelist: never the pasted value (ADR-0002).
      trackEvent({ name: "timestamp_copied", metadata: eventMetadata(unit, zone) });
    } catch {
      showFeedback(labels.copyFailed);
    }
  }

  function useCurrentTime() {
    const now = Date.now();
    setInput(String(Math.floor(now / 1000)));
    setUnit("auto");
    setNowMs(now);
  }

  function changeZone(next: string) {
    setZone(next);
    trackEvent({ name: "timestamp_zone", metadata: eventMetadata(unit, next) });
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="ts-input"
          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {labels.inputLabel}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="ts-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={labels.inputPlaceholder}
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            data-testid="ts-input"
          />
          <Button variant="outline" onClick={useCurrentTime} data-testid="ts-now">
            <ClockIcon data-icon="inline-start" />
            {labels.useCurrentTime}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ts-unit"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {labels.unitLabel}
          </label>
          <select
            id="ts-unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value as UnitChoice)}
            className={controlClassName}
            data-testid="ts-unit"
          >
            {unitChoiceIds.map((id) => (
              <option key={id} value={id}>
                {labels.unitNames[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ts-zone"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {labels.zoneLabel}
          </label>
          <TimezonePicker
            value={zone}
            onChange={changeZone}
            labels={{
              zoneLocalLabel: labels.zoneLocalLabel,
              zoneSearchPlaceholder: labels.zoneSearchPlaceholder,
              zoneNoResults: labels.zoneNoResults,
            }}
            className={controlClassName}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground" data-testid="ts-zone-note">
        {labels.zoneNote}
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {labels.resultsLabel}
          </p>
          {view ? (
            <p className="text-xs font-medium text-primary" data-testid="ts-detected">
              {detectedText}
            </p>
          ) : null}
        </div>

        {view ? (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.id}>
                <ResultRow row={row} copyLabel={labels.copy} onCopy={copyValue} />
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
            data-testid="ts-error"
          >
            {errorText}
          </div>
        )}

        {view && unit === "auto" ? (
          <p className="text-xs text-muted-foreground" data-testid="ts-unit-hint">
            {labels.unitHeuristicHint}
          </p>
        ) : null}
        {showNegative ? (
          <p className="text-xs text-muted-foreground" data-testid="ts-negative-hint">
            {labels.negativeHint}
          </p>
        ) : null}
        {show2038 ? (
          <p className="text-xs text-muted-foreground" data-testid="ts-2038-hint">
            {labels.year2038Hint}
          </p>
        ) : null}

        <span
          role="status"
          className="min-w-0 truncate text-xs text-muted-foreground"
          data-testid="ts-feedback"
        >
          {feedback}
        </span>
      </div>

      <div className="rounded-lg border border-border/60 px-4 py-3">
        <p className="text-xs font-semibold text-foreground">
          {labels.examplesLabel}
        </p>
        <p className="mt-1 font-mono text-xs leading-5 text-muted-foreground break-all">
          {labels.examplesBody}
        </p>
      </div>

      <Collapsible>
        <CollapsibleTrigger data-testid="ts-more-toggle">
          <span>{labels.moreFormatsLabel}</span>
          <ChevronDownIcon
            data-icon="inline-end"
            className="transition-transform group-data-panel-open/collapsible-trigger:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          {view ? (
            <div className="flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {moreRows.map((row) => (
                  <li key={row.id}>
                    <ResultRow row={row} copyLabel={labels.copy} onCopy={copyValue} />
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {labels.codeSnippetsLabel}
                </p>
                <ul className="flex flex-col gap-1">
                  {snippets.map((snippet) => (
                    <li key={snippet.language} className="flex gap-2">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">
                        {snippet.language}
                      </span>
                      <code className="min-w-0 flex-1 font-mono text-xs break-all">
                        {snippet.code}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{labels.loading}</p>
          )}
        </CollapsiblePanel>
      </Collapsible>

      <section className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/40 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-primary">
          {labels.howItWorksTitle}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {labels.howItWorksBody}
        </p>
        <p className="text-xs text-muted-foreground">{labels.privacyNote}</p>
        <p className="text-xs text-muted-foreground">{labels.privacyHashNote}</p>
      </section>

      <div className="flex justify-end">
        <ShareToXButton
          labels={shareLabels}
          tool="unix-timestamp-converter"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
      </div>
    </div>
  );
}
