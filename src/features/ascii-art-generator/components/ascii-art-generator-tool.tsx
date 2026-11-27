"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardIcon, DownloadIcon, ImageIcon, TypeIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { getMessages, type Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { AsciiPreview, type AsciiPreviewLabels } from "./ascii-preview";
import {
  asciiFilename,
  canvasToBlob,
  downloadBlob,
  paintAsciiArt,
} from "../lib/export";
import { decodeImageSource, type ImageSource } from "../lib/image-source";
import { renderImageAscii } from "../lib/image-render";
import { renderAscii, type AsciiRenderResult } from "../lib/render";
import { stateToParams } from "../lib/settings";
import {
  alignIds,
  backgroundIds,
  ditherIds,
  fontIds,
  maxBrightness,
  maxContrast,
  maxGap,
  maxTextLength,
  maxVGap,
  maxWidth,
  minBrightness,
  minContrast,
  minGap,
  minVGap,
  minWidth,
  modeIds,
  rampIds,
  type Align,
  type AsciiBackground,
  type AsciiMode,
  type AsciiState,
  type DitherId,
  type FontId,
  type RampId,
} from "../lib/types";

type Labels = Messages["asciiArt"];

export type { AsciiState } from "../lib/types";

const emptyResult: AsciiRenderResult = {
  lines: [],
  width: 0,
  hasUnsupported: false,
  unsupported: [],
};

function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  testId,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  testId: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={testId}>{label}</FieldLabel>
        <span className="text-[11px] tabular-nums text-muted-foreground">{display}</span>
      </div>
      <input
        id={testId}
        data-testid={testId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </Field>
  );
}

export function AsciiArtGeneratorTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Labels;
  initialState: AsciiState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);
  const [feedback, setFeedback] = useState("");
  const [image, setImage] = useState<ImageSource | null>(null);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadSeqRef = useRef(0);
  const loadSourceRef = useRef<(input: File) => Promise<void>>(async () => {});

  const textResult = useMemo(
    () =>
      renderAscii({
        text: state.text,
        font: state.font,
        gap: state.gap,
        vGap: state.vGap,
        flip: state.flip,
        align: state.align,
      }),
    [state.text, state.font, state.gap, state.vGap, state.flip, state.align]
  );

  const imageResult = useMemo(
    () =>
      image
        ? renderImageAscii(image.grid, {
            width: state.width,
            ramp: state.ramp,
            brightness: state.brightness,
            contrast: state.contrast,
            invert: state.invert,
            dither: state.dither,
          })
        : emptyResult,
    [image, state.width, state.ramp, state.brightness, state.contrast, state.invert, state.dither]
  );

  const result = state.mode === "image" ? imageResult : textResult;
  const hasResult = result.lines.length > 0;

  const shareParams = new URLSearchParams();
  for (const [key, value] of Object.entries(stateToParams(state))) {
    if (value !== undefined) shareParams.set(key, value);
  }
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/ascii-art-generator")}?${shareParams.toString()}`;

  const flash = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 2600);
  }, []);

  const loadSource = useCallback(
    async (input: File) => {
      const sequence = (loadSeqRef.current += 1);
      setLoading(true);
      setImageError("");
      try {
        const source = await decodeImageSource(input);
        if (sequence !== loadSeqRef.current) {
          if (source.objectUrl) URL.revokeObjectURL(source.objectUrl);
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = source.objectUrl ?? null;
        setImage(source);
        flash(`${labels.imageLoaded} ${source.name} (${source.width}×${source.height})`);
        trackEvent({ name: "ascii_art_image_loaded" });
      } catch (error) {
        if (sequence === loadSeqRef.current) {
          const unsupported = error instanceof Error && error.message === "UNSUPPORTED_FILE";
          setImageError(unsupported ? labels.unsupportedFile : labels.imageLoadFailed);
        }
      } finally {
        if (sequence === loadSeqRef.current) setLoading(false);
      }
    },
    [flash, labels.imageLoaded, labels.imageLoadFailed, labels.unsupportedFile]
  );

  loadSourceRef.current = loadSource;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.mode !== "image") return;
    function onPaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
        item.type.startsWith("image/")
      );
      if (!file) return;
      event.preventDefault();
      void loadSourceRef.current(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [state.mode]);

  function updateState(nextPartial: Partial<AsciiState>) {
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

  async function copyText() {
    if (!hasResult) return;
    try {
      await navigator.clipboard.writeText(result.lines.join("\n"));
      flash(labels.copied);
      trackEvent({ name: "ascii_art_copied", metadata: { mode: state.mode } });
    } catch {
      flash(labels.copyFailed);
    }
  }

  async function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas || !hasResult) return;
    paintAsciiArt(canvas, result, state.background);
    try {
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, asciiFilename(state.mode === "image" ? "image" : state.font));
      flash(labels.downloaded);
      trackEvent({ name: "ascii_art_downloaded", metadata: { mode: state.mode } });
    } catch {
      flash(labels.downloadFailed);
    }
  }

  function handleFile(file?: File) {
    if (!file) return;
    void loadSource(file);
  }

  const previewLabels: AsciiPreviewLabels = {
    preview: labels.preview,
    empty: state.mode === "image" ? labels.imageEmpty : labels.empty,
    unsupported: labels.unsupportedHint,
    width: labels.columns,
  };

  const modeControls = (
    <Field>
      <FieldLabel>{labels.modeLabel}</FieldLabel>
      <ToggleGroup
        variant="outline"
        value={[state.mode]}
        onValueChange={(value) => {
          if (value[0]) updateState({ mode: value[0] as AsciiMode });
        }}
        data-testid="ascii-mode"
      >
        {modeIds.map((mode) => (
          <ToggleGroupItem key={mode} value={mode} data-testid={`ascii-mode-${mode}`}>
            {mode === "text" ? <TypeIcon /> : <ImageIcon />}
            {labels.modeNames[mode]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );

  const backgroundControl = (
    <Field>
      <FieldLabel>{labels.backgroundLabel}</FieldLabel>
      <ToggleGroup
        variant="outline"
        value={[state.background]}
        onValueChange={(value) => {
          if (value[0]) updateState({ background: value[0] as AsciiBackground });
        }}
        data-testid="ascii-background"
      >
        {backgroundIds.map((background) => (
          <ToggleGroupItem
            key={background}
            value={background}
            data-testid={`ascii-background-${background}`}
          >
            {labels.backgroundNames[background]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription>{labels.backgroundHint}</FieldDescription>
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="ascii-input-heading"
          className="scrollbar-slim flex h-[340px] flex-col gap-4 overflow-y-auto rounded-2xl border border-border/70 bg-card/40 p-4 pr-3 lg:h-[460px]"
        >
          {modeControls}

          {state.mode === "text" ? (
            <>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2
                    id="ascii-input-heading"
                    data-testid="ascii-input-heading"
                    className="text-xs font-semibold tracking-tight text-primary"
                  >
                    {labels.inputLabel}
                  </h2>
                  <span data-testid="ascii-count" className="text-[11px] text-muted-foreground">
                    {state.text.length} / {maxTextLength}
                  </span>
                </div>
                <Input
                  data-testid="ascii-text"
                  value={state.text}
                  placeholder={labels.inputPlaceholder}
                  onChange={(event) => updateState({ text: event.target.value })}
                  className="mt-2 font-mono text-sm uppercase"
                />
                <FieldDescription className="mt-1.5">{labels.inputHint}</FieldDescription>
              </div>

              <Field>
                <FieldLabel>{labels.fontLabel}</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[state.font]}
                  onValueChange={(value) => {
                    if (value[0]) updateState({ font: value[0] as FontId });
                  }}
                  className="flex flex-wrap"
                  data-testid="ascii-font"
                >
                  {fontIds.map((font) => (
                    <ToggleGroupItem key={font} value={font} data-testid={`ascii-font-${font}`}>
                      {labels.fontNames[font]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>{labels.gapLabel}</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[String(state.gap)]}
                  onValueChange={(value) => {
                    if (value[0]) {
                      const numeric = Number(value[0]);
                      if (Number.isFinite(numeric)) {
                        updateState({ gap: Math.max(minGap, Math.min(maxGap, numeric)) });
                      }
                    }
                  }}
                  className="flex flex-wrap"
                  data-testid="ascii-gap"
                >
                  {Array.from({ length: maxGap - minGap + 1 }, (_, index) => minGap + index).map((gap) => (
                    <ToggleGroupItem key={gap} value={String(gap)} data-testid={`ascii-gap-${gap}`}>
                      {gap}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>{labels.alignLabel}</FieldLabel>
                  <ToggleGroup
                    variant="outline"
                    value={[state.align]}
                    onValueChange={(value) => {
                      if (value[0]) updateState({ align: value[0] as Align });
                    }}
                    className="flex flex-wrap"
                    data-testid="ascii-align"
                  >
                    {alignIds.map((align) => (
                      <ToggleGroupItem key={align} value={align} data-testid={`ascii-align-${align}`}>
                        {labels.alignNames[align]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>{labels.vGapLabel}</FieldLabel>
                  <ToggleGroup
                    variant="outline"
                    value={[String(state.vGap)]}
                    onValueChange={(value) => {
                      if (value[0]) {
                        const numeric = Number(value[0]);
                        if (Number.isFinite(numeric)) {
                          updateState({ vGap: Math.max(minVGap, Math.min(maxVGap, numeric)) });
                        }
                      }
                    }}
                    className="flex flex-wrap"
                    data-testid="ascii-vgap"
                  >
                    {Array.from({ length: maxVGap - minVGap + 1 }, (_, index) => minVGap + index).map((vGap) => (
                      <ToggleGroupItem key={vGap} value={String(vGap)} data-testid={`ascii-vgap-${vGap}`}>
                        {vGap}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              </div>

              <Toggle
                variant="outline"
                pressed={state.flip}
                onPressedChange={(pressed) => updateState({ flip: pressed })}
                data-testid="ascii-flip"
              >
                {labels.flipLabel}
              </Toggle>
              {backgroundControl}
            </>
          ) : (
            <>
              <div>
                <h2
                  id="ascii-input-heading"
                  data-testid="ascii-input-heading"
                  className="text-xs font-semibold tracking-tight text-primary"
                >
                  {labels.imageInputLabel}
                </h2>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  data-testid="ascii-image-input"
                  className="sr-only"
                  onChange={(event) => {
                    handleFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  data-testid="ascii-image-upload"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    handleFile(event.dataTransfer.files?.[0]);
                  }}
                  className={`mt-2 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition-[border-color,background-color] duration-150 ease-[var(--ease-out)] hover:border-primary/60 hover:bg-primary/5 ${
                    dragging ? "border-primary bg-primary/10" : "border-border/70"
                  }`}
                >
                  <UploadIcon className="size-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{labels.imageUpload}</span>
                  <span className="text-[11px] leading-4 text-muted-foreground">{labels.imageDropHint}</span>
                </button>
                {image ? (
                  <p data-testid="ascii-image-name" className="mt-1.5 truncate text-[11px] text-muted-foreground">
                    {image.name} · {image.width}×{image.height}
                  </p>
                ) : null}
                {loading ? (
                  <p role="status" className="mt-1 text-[11px] text-muted-foreground">…</p>
                ) : null}
                {imageError ? (
                  <p role="alert" data-testid="ascii-image-error" className="mt-1 text-[11px] text-destructive">
                    {imageError}
                  </p>
                ) : null}
              </div>

              <SliderField
                label={labels.widthLabel}
                value={state.width}
                min={minWidth}
                max={maxWidth}
                step={5}
                display={String(state.width)}
                testId="ascii-width"
                onChange={(value) => updateState({ width: value })}
              />

              <Field>
                <FieldLabel>{labels.rampLabel}</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[state.ramp]}
                  onValueChange={(value) => {
                    if (value[0]) updateState({ ramp: value[0] as RampId });
                  }}
                  data-testid="ascii-ramp"
                >
                  {rampIds.map((ramp) => (
                    <ToggleGroupItem key={ramp} value={ramp} data-testid={`ascii-ramp-${ramp}`}>
                      {labels.rampNames[ramp]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <SliderField
                  label={labels.brightnessLabel}
                  value={state.brightness}
                  min={minBrightness}
                  max={maxBrightness}
                  step={5}
                  display={String(state.brightness)}
                  testId="ascii-brightness"
                  onChange={(value) => updateState({ brightness: value })}
                />
                <SliderField
                  label={labels.contrastLabel}
                  value={state.contrast}
                  min={minContrast}
                  max={maxContrast}
                  step={0.1}
                  display={`${state.contrast.toFixed(1)}×`}
                  testId="ascii-contrast"
                  onChange={(value) => updateState({ contrast: value })}
                />
              </div>

              <Field>
                <FieldLabel>{labels.ditherLabel}</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  value={[state.dither]}
                  onValueChange={(value) => {
                    if (value[0]) updateState({ dither: value[0] as DitherId });
                  }}
                  data-testid="ascii-dither"
                >
                  {ditherIds.map((dither) => (
                    <ToggleGroupItem key={dither} value={dither} data-testid={`ascii-dither-${dither}`}>
                      {labels.ditherNames[dither]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <div className="flex flex-wrap gap-2">
                <Toggle
                  variant="outline"
                  pressed={state.invert}
                  onPressedChange={(pressed) => updateState({ invert: pressed })}
                  data-testid="ascii-invert"
                >
                  {labels.invertLabel}
                </Toggle>
              </div>
              {backgroundControl}
            </>
          )}
        </section>

        <AsciiPreview
          result={result}
          labels={previewLabels}
          colorize={state.mode === "image"}
          background={state.background}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button data-testid="ascii-copy" onClick={() => void copyText()} disabled={!hasResult}>
          <ClipboardIcon data-icon="inline-start" />
          {labels.copyText}
        </Button>
        <Button
          variant="outline"
          data-testid="ascii-download"
          onClick={() => void downloadPng()}
          disabled={!hasResult}
        >
          <DownloadIcon data-icon="inline-start" />
          {labels.download}
        </Button>
        <ShareToXButton
          labels={getMessages(locale).share}
          tool="ascii-art-generator"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {state.mode === "image" ? labels.imageShareHint : labels.privacyNote}
      </p>
      <span role="status" data-testid="ascii-feedback" className="text-xs text-muted-foreground">
        {feedback}
      </span>

      <canvas ref={canvasRef} className="hidden" aria-hidden data-testid="ascii-canvas" />
    </div>
  );
}
