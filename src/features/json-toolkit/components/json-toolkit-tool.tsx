"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BracesIcon, ClipboardIcon, Maximize2Icon, Minimize2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import type { Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { JsonCodeBlock } from "./json-code-block";
import { delimitedToJson, jsonToDelimited } from "../lib/csv";
import { formatJson } from "../lib/format";
import { stateToParams } from "../lib/settings";
import {
  defaultSampleJson,
  delimiterIds,
  directionIds,
  indentIds,
  tabIds,
  type DelimiterId,
  type Direction,
  type IndentId,
  type ToolkitState,
} from "../lib/types";

type Labels = Messages["jsonToolkit"];

export type { ToolkitState } from "../lib/types";

const acceptedExtensions = [".json", ".txt"];

export function JsonToolkitTool({
  locale,
  labels,
  shareLabels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Labels;
  shareLabels: Messages["share"];
  initialState: ToolkitState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);
  const [input, setInput] = useState(defaultSampleJson);
  const [feedback, setFeedback] = useState("");
  const [oneLine, setOneLine] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const isFormat = state.tab === "format";
  // Keep the textarea responsive; the derived views may lag by a frame.
  const deferredInput = useDeferredValue(input);

  // Only the active tab's transformation is needed. In particular the CSV
  // conversion must not run while the user is formatting JSON, and vice versa.
  const formatResult = useMemo(
    () => (isFormat ? formatJson(deferredInput, { indent: state.indent, sortKeys: state.sortKeys }) : null),
    [deferredInput, isFormat, state.indent, state.sortKeys]
  );
  const conversion = useMemo(
    () =>
      isFormat
        ? null
        : state.direction === "to-csv"
          ? jsonToDelimited(deferredInput, state.delimiter)
          : delimitedToJson(deferredInput, state.delimiter),
    [deferredInput, isFormat, state.direction, state.delimiter]
  );
  const result = isFormat ? formatResult! : conversion!;
  const compact = isFormat && oneLine;
  const minifiedResult = useMemo(
    () => (compact ? formatJson(deferredInput, { minify: true, sortKeys: state.sortKeys }) : null),
    [compact, deferredInput, state.sortKeys]
  );
  const displayText = !result.ok
    ? labels.invalidOutput
    : compact && minifiedResult?.ok
      ? minifiedResult.text
      : result.text;
  // formatJson already parsed the input; reusing that value avoids a second parse.
  const viewValue = !compact && formatResult?.ok ? formatResult.value : undefined;
  // The tree renderer creates one DOM node per line. Large documents fall back
  // to a single <pre> so pasting a big JSON file cannot freeze the page.
  const treeValue = result.ok && result.text.length < 100_000 ? viewValue : undefined;

  const errorText = result.ok
    ? ""
    : "issue" in result
      ? `${labels.line} ${result.issue.line}:${labels.column} ${result.issue.column} — ${result.issue.message}`
      : result.message;

  const shareParams = new URLSearchParams();
  for (const [key, value] of Object.entries(stateToParams(state))) {
    if (value !== undefined) shareParams.set(key, value);
  }
  const query = shareParams.toString();
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/json-toolkit")}${query ? `?${query}` : ""}`;

  const flash = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  function updateState(nextPartial: Partial<ToolkitState>) {
    const nextState = { ...state, ...nextPartial };
    setState(nextState);
    if (!shouldSyncUrl) return;
    // Never call replaceState from a setState updater — App Router patches
    // history and would update Router during render (Palette Studio hit this).
    replaceSearchState(
      pathname,
      new URLSearchParams(searchParams.toString()),
      stateToParams(nextState)
    );
  }

  function handleFile(file?: File) {
    if (!file) return;
    if (!acceptedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      flash(labels.fileInvalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setInput(typeof reader.result === "string" ? reader.result : "");
      flash(`${labels.fileLoaded} ${file.name}`);
      trackEvent({ name: "json_toolkit_file_loaded" });
    };
    reader.onerror = () => flash(labels.fileFailed);
    reader.readAsText(file);
  }

  function handleMinify() {
    const minified = formatJson(input, { minify: true, sortKeys: state.sortKeys });
    if (!minified.ok) {
      flash(errorText);
      return;
    }
    setInput(minified.text);
    flash(labels.minified);
    trackEvent({ name: "json_toolkit_minified" });
  }

  async function copyOutput() {
    if (!result.ok) return;
    try {
      await navigator.clipboard.writeText(result.text);
      flash(labels.copied);
      trackEvent({ name: "json_toolkit_copied", metadata: { tab: state.tab } });
    } catch {
      flash(labels.copyFailed);
    }
  }

  const tabControl = (
    <Field>
      <FieldLabel>{labels.modeLabel}</FieldLabel>
      <ToggleGroup
        variant="outline"
        value={[state.tab]}
        onValueChange={(value) => {
          if (value[0]) updateState({ tab: value[0] as ToolkitState["tab"] });
        }}
        data-testid="json-tab"
      >
        {tabIds.map((tab) => (
          <ToggleGroupItem key={tab} value={tab} data-testid={`json-tab-${tab}`}>
            {labels.tabNames[tab]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );

  const formatControls = (
    <>
      <Field>
        <FieldLabel>{labels.indentLabel}</FieldLabel>
        <ToggleGroup
          variant="outline"
          value={[state.indent]}
          onValueChange={(value) => {
            if (value[0]) updateState({ indent: value[0] as IndentId });
          }}
          data-testid="json-indent"
        >
          {indentIds.map((indent) => (
            <ToggleGroupItem key={indent} value={indent} data-testid={`json-indent-${indent}`}>
              {labels.indentNames[indent]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel>{labels.sortLabel}</FieldLabel>
        <Toggle
          variant="outline"
          pressed={state.sortKeys}
          onPressedChange={(pressed) => updateState({ sortKeys: pressed })}
          data-testid="json-sort"
        >
          {labels.sortAction}
        </Toggle>
        <FieldDescription>{labels.sortHint}</FieldDescription>
      </Field>
      <Button variant="outline" onClick={handleMinify} data-testid="json-minify">
        <BracesIcon />
        {labels.minify}
      </Button>
    </>
  );

  const convertControls = (
    <>
      <Field>
        <FieldLabel>{labels.directionLabel}</FieldLabel>
        <ToggleGroup
          variant="outline"
          value={[state.direction]}
          onValueChange={(value) => {
            if (value[0]) updateState({ direction: value[0] as Direction });
          }}
          data-testid="json-direction"
        >
          {directionIds.map((direction) => (
            <ToggleGroupItem
              key={direction}
              value={direction}
              data-testid={`json-direction-${direction}`}
            >
              {labels.directionNames[direction]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel>{labels.delimiterLabel}</FieldLabel>
        <ToggleGroup
          variant="outline"
          value={[state.delimiter]}
          onValueChange={(value) => {
            if (value[0]) updateState({ delimiter: value[0] as DelimiterId });
          }}
          data-testid="json-delimiter"
        >
          {delimiterIds.map((delimiter) => (
            <ToggleGroupItem
              key={delimiter}
              value={delimiter}
              data-testid={`json-delimiter-${delimiter}`}
            >
              {labels.delimiterNames[delimiter]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <FieldDescription>{labels.lossyHint}</FieldDescription>
      </Field>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="json-input-heading"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
          className={`flex min-w-0 flex-col gap-4 self-start rounded-2xl border bg-card/40 p-4 ${
            dragging ? "border-primary" : "border-border/70"
          }`}
        >
          {tabControl}

          <div>
            <div className="flex items-center justify-between gap-2">
              <h2
                id="json-input-heading"
                className="text-xs font-semibold tracking-tight text-primary"
              >
                {isFormat ? labels.inputLabel : labels.convertInputLabel}
              </h2>
              <span className="text-[11px] text-muted-foreground">{input.length} chars</span>
            </div>
            <textarea
              data-testid="json-input"
              value={input}
              spellCheck={false}
              placeholder={labels.inputPlaceholder}
              onChange={(event) => setInput(event.target.value)}
              className="mt-2 h-40 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <FieldDescription className="mt-1.5">{labels.dropHint}</FieldDescription>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            data-testid="json-file"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            {labels.chooseFile}
          </Button>

          {isFormat ? formatControls : convertControls}

          <Button variant="ghost" onClick={() => setInput("")} data-testid="json-clear">
            {labels.clear}
          </Button>
        </section>

        <section
          aria-labelledby="json-output-heading"
          className="flex h-[460px] min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/40 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="json-output-heading"
              className="text-xs font-semibold tracking-tight text-primary"
            >
              {labels.outputLabel}
            </h2>
            {isFormat ? (
              <Button
                variant="ghost"
                size="xs"
                data-testid="json-output-toggle"
                aria-expanded={!compact}
                aria-controls="json-output-region"
                disabled={!result.ok}
                onClick={() => setOneLine((collapsed) => !collapsed)}
              >
                {compact ? <Maximize2Icon /> : <Minimize2Icon />}
                {compact ? labels.expandResult : labels.collapseResult}
              </Button>
            ) : null}
          </div>
          {treeValue !== undefined ? (
            <JsonCodeBlock
              value={treeValue}
              indent={state.indent}
              labels={{ collapseNode: labels.collapseNode, expandNode: labels.expandNode }}
            />
          ) : (
            <pre
              id="json-output-region"
              data-testid="json-output"
              className={`scrollbar-slim min-h-0 min-w-0 flex-1 overflow-auto font-mono text-sm leading-6 ${
                compact ? "whitespace-nowrap" : "whitespace-pre-wrap break-words"
              }`}
            >
              {displayText}
            </pre>
          )}
          <p
            data-testid="json-status"
            aria-live="polite"
            className={`text-xs ${result.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {result.ok
              ? `${labels.validStatus} · ${result.text.length} chars`
              : errorText}
          </p>
          <FieldDescription>{labels.shareHint}</FieldDescription>
          <FieldDescription>{labels.privacyNote}</FieldDescription>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void copyOutput()} data-testid="json-copy" disabled={!result.ok}>
          <ClipboardIcon />
          {labels.copy}
        </Button>
        <ShareToXButton
          labels={shareLabels}
          tool="json-toolkit"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {feedback}
        </span>
      </div>
    </div>
  );
}
