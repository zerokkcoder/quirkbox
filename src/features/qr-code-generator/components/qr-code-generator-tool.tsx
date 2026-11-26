"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { QrPreview, type QrPreviewLabels } from "@/features/qr-code-generator/components/qr-preview";
import { canvasToBlob, downloadBlob, filenameStem } from "@/features/qr-code-generator/lib/export";
import { QrTooLongError, buildMatrix } from "@/features/qr-code-generator/lib/matrix";
import { hasLowContrast } from "@/features/qr-code-generator/lib/render";
import { normalizeHex, stateToParams, textByteLength } from "@/features/qr-code-generator/lib/settings";
import { matrixToSvg } from "@/features/qr-code-generator/lib/svg";
import {
  dotStyles,
  errorLevels,
  exportSizes,
  maxBytesByLevel,
  type DotStyle,
  type ErrorLevel,
  type ExportSize,
  type LogoData,
  type QrState,
} from "@/features/qr-code-generator/lib/types";
import { trackEvent } from "@/lib/analytics";
import { getMessages, type Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { localizePath } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site";

type Labels = Messages["qrCodeGenerator"];

export function QrCodeGeneratorTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Labels;
  initialState: QrState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [feedback, setFeedback] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const generated = useMemo(() => {
    try {
      return { matrix: buildMatrix(state.text, state.level), tooLong: false };
    } catch (error) {
      return {
        matrix: null,
        tooLong: error instanceof QrTooLongError,
      };
    }
  }, [state.text, state.level]);

  const byteLength = textByteLength(state.text);
  const capacity = maxBytesByLevel[state.level];
  const lowContrast = hasLowContrast(state.foreground, state.background);
  const shareParams = new URLSearchParams();
  for (const [key, value] of Object.entries(stateToParams(state))) {
    if (value !== undefined) shareParams.set(key, value);
  }
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/qr-code-generator")}?${shareParams.toString()}`;

  function showFeedback(message: string) {
    setFeedback(message);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 4000);
  }

  function syncUrlFor(next: QrState) {
    if (!shouldSyncUrl) return;
    // Never call replaceState from a setState updater — the App Router patches
    // history and would update Router during render.
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), stateToParams(next));
  }

  function updateState(next: Partial<QrState>) {
    const nextState = { ...state, ...next };
    setState(nextState);
    syncUrlFor(nextState);
  }

  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const probe = new Image();
      probe.onload = () => {
        setLogo({
          dataUrl,
          width: probe.naturalWidth,
          height: probe.naturalHeight,
          filename: file.name,
        });
        showFeedback(labels.feedback.logoAdded);
        trackEvent({ name: "qr_logo_added" });
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogo(null);
    showFeedback(labels.feedback.logoRemoved);
  }

  async function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas || !generated.matrix) return;
    try {
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, `${filenameStem(state.text)}.png`);
      showFeedback(labels.feedback.pngDownloaded);
      trackEvent({ name: "qr_downloaded", metadata: { format: "png" } });
    } catch {
      showFeedback(labels.feedback.downloadFailed);
    }
  }

  function downloadSvg() {
    if (!generated.matrix) return;
    const svg = matrixToSvg(generated.matrix, {
      foreground: state.foreground,
      background: state.background,
      dots: state.dots,
      transparent: state.transparent,
      logoDataUrl: logo?.dataUrl,
      logoWidth: logo?.width,
      logoHeight: logo?.height,
    });
    downloadBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      `${filenameStem(state.text)}.svg`
    );
    showFeedback(labels.feedback.svgDownloaded);
    trackEvent({ name: "qr_downloaded", metadata: { format: "svg" } });
  }

  const previewLabels: QrPreviewLabels = {
    preview: labels.preview,
    downloadPng: labels.downloadPng,
    downloadSvg: labels.downloadSvg,
    empty: labels.empty,
    tooLong: labels.tooLong,
    lowContrast: labels.lowContrast,
    logoHint: labels.logoHint,
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        data-testid="qr-logo-input"
        className="sr-only"
        onChange={handleLogoFile}
      />

      {/* Input + controls on the left, live preview on the right, both above the fold. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="qr-input-heading"
          className="scrollbar-slim flex h-[340px] flex-col gap-3 overflow-y-auto rounded-2xl border border-border/70 bg-card/40 p-4 pr-3 lg:h-[460px]"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2
                id="qr-input-heading"
                data-testid="qr-input-heading"
                className="text-xs font-semibold tracking-tight text-primary"
              >
                {labels.inputLabel}
              </h2>
              <span
                data-testid="qr-capacity"
                className={`text-[11px] ${byteLength > capacity ? "text-destructive" : "text-muted-foreground"}`}
              >
                {byteLength} / {capacity} B
              </span>
            </div>
            <Input
              data-testid="qr-text"
              value={state.text}
              placeholder={labels.inputPlaceholder}
              onChange={(event) => updateState({ text: event.target.value })}
              className="mt-2 font-mono text-sm"
            />
          </div>

          <Field>
            <FieldLabel>{labels.levelLabel}</FieldLabel>
            <ToggleGroup
              variant="outline"
              value={[state.level]}
              onValueChange={(value) => {
                if (value[0]) updateState({ level: value[0] as ErrorLevel });
              }}
            >
              {errorLevels.map((level) => (
                <ToggleGroupItem key={level} value={level} data-testid={`qr-level-${level}`}>
                  {level}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.levelHint}</FieldDescription>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>{labels.sizeLabel}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[String(state.size)]}
                onValueChange={(value) => {
                  if (value[0]) updateState({ size: Number(value[0]) as ExportSize });
                }}
              >
                {exportSizes.map((size) => (
                  <ToggleGroupItem key={size} value={String(size)} data-testid={`qr-size-${size}`}>
                    {size}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>{labels.dotsLabel}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[state.dots]}
                onValueChange={(value) => {
                  if (value[0]) updateState({ dots: value[0] as DotStyle });
                }}
              >
                {dotStyles.map((dots) => (
                  <ToggleGroupItem key={dots} value={dots} data-testid={`qr-dots-${dots}`}>
                    {labels.dotsNames[dots]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="qr-foreground">{labels.foregroundLabel}</FieldLabel>
              <div className="flex gap-2">
                <input
                  id="qr-foreground"
                  data-testid="qr-foreground"
                  type="color"
                  value={`#${state.foreground}`}
                  onChange={(event) => updateState({ foreground: normalizeHex(event.target.value, state.foreground) })}
                  className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
                <Input
                  data-testid="qr-foreground-hex"
                  aria-label={labels.foregroundLabel}
                  value={`#${state.foreground}`}
                  onChange={(event) => updateState({ foreground: normalizeHex(event.target.value, state.foreground) })}
                  className="font-mono text-sm"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="qr-background">{labels.backgroundLabel}</FieldLabel>
              <div className="flex gap-2">
                <input
                  id="qr-background"
                  data-testid="qr-background"
                  type="color"
                  value={`#${state.background}`}
                  onChange={(event) => updateState({ background: normalizeHex(event.target.value, state.background) })}
                  className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
                <Input
                  data-testid="qr-background-hex"
                  aria-label={labels.backgroundLabel}
                  value={`#${state.background}`}
                  onChange={(event) => updateState({ background: normalizeHex(event.target.value, state.background) })}
                  className="font-mono text-sm"
                />
              </div>
            </Field>
          </div>

          <Field>
            <FieldLabel>{labels.transparentLabel}</FieldLabel>
            <ToggleGroup
              variant="outline"
              value={[state.transparent ? "on" : "off"]}
              onValueChange={(value) => {
                if (value[0]) updateState({ transparent: value[0] === "on" });
              }}
            >
              <ToggleGroupItem value="off" data-testid="qr-transparent-off">
                {labels.off}
              </ToggleGroupItem>
              <ToggleGroupItem value="on" data-testid="qr-transparent-on">
                {labels.on}
              </ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>{labels.transparentHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.logoLabel}</FieldLabel>
            {logo ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                {/* Local data-URL thumbnail, not a network image — next/image offers no benefit. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.dataUrl} alt={labels.logoLabel} className="size-8 rounded object-contain" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{logo.filename}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  data-testid="qr-logo-remove"
                  aria-label={labels.logoRemove}
                  onClick={removeLogo}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                data-testid="qr-logo-add"
                onClick={() => logoInputRef.current?.click()}
              >
                <ImagePlusIcon data-icon="inline-start" />
                {labels.logoAdd}
              </Button>
            )}
          </Field>
        </section>

        <QrPreview
          canvasRef={canvasRef}
          matrix={generated.matrix}
          size={state.size}
          foreground={state.foreground}
          background={state.background}
          dots={state.dots}
          transparent={state.transparent}
          logo={logo}
          labels={previewLabels}
          warnings={{ tooLong: generated.tooLong, lowContrast }}
          onDownloadPng={() => void downloadPng()}
          onDownloadSvg={downloadSvg}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ShareToXButton
          labels={getMessages(locale).share}
          tool="qr-code-generator"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{labels.shareWarning}</p>
      <p className="text-xs leading-5 text-muted-foreground">{labels.privacyNote}</p>

      <span role="status" data-testid="qr-feedback" className="text-xs text-muted-foreground">
        {feedback}
      </span>
    </div>
  );
}
