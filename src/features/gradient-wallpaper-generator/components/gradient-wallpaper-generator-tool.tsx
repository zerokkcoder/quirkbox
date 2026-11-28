"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ClipboardIcon, DownloadIcon, ShuffleIcon } from "lucide-react";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import type { Messages } from "@/lib/i18n";
import { createSeed } from "@/lib/seeds";
import { replaceSearchState } from "@/lib/url-state";
import { useDebouncedCallback } from "@/lib/use-debounced";
import { ColorStopTrack, type ColorStopTrackLabels } from "./color-stop-track";
import { GradientPreview } from "./gradient-preview";
import { exportGradientWallpaper } from "@/features/gradient-wallpaper-generator/lib/export";
import { buildCssGradient, canUseConicGradient } from "@/features/gradient-wallpaper-generator/lib/gradient";
import { buildPaletteFromSeed } from "@/features/gradient-wallpaper-generator/lib/palette";
import { stateToParams } from "@/features/gradient-wallpaper-generator/lib/settings";
import {
  centerPresets,
  gradientRatioIds,
  gradientTypeIds,
  type GradientState,
} from "@/features/gradient-wallpaper-generator/lib/types";

export type { GradientState } from "@/features/gradient-wallpaper-generator/lib/types";

export function GradientWallpaperGeneratorTool({
  locale,
  labels,
  shareLabels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Messages["gradientWallpaper"];
  shareLabels: Messages["share"];
  initialState: GradientState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const [state, setState] = useState(initialState);
  const [feedback, setFeedback] = useState("");
  const feedbackTimerRef = useRef<number | null>(null);

  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/gradient-wallpaper-generator")}`;
  const cssValue = buildCssGradient(state);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const syncUrl = useDebouncedCallback((nextState: GradientState) => {
    replaceSearchState(pathname, new URLSearchParams(window.location.search), stateToParams(nextState));
  });

  function updateState(nextPartial: Partial<GradientState>) {
    const nextState = { ...state, ...nextPartial };
    setState(nextState);
    if (!shouldSyncUrl) return;
    syncUrl(nextState);
  }

  function flash(message: string) {
    setFeedback(message);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 2600);
  }

  function shuffle() {
    const seed = createSeed(10);
    updateState({ seed, stops: buildPaletteFromSeed(seed) });
    trackEvent({ name: "gradient_wallpaper_shuffled" });
  }

  function download() {
    exportGradientWallpaper(state, labels.sampleText);
    trackEvent({ name: "gradient_wallpaper_downloaded", metadata: { ratio: state.ratio, type: state.type } });
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(`background-image: ${cssValue};`);
      flash(labels.cssCopied);
      trackEvent({ name: "gradient_wallpaper_css_copied" });
    } catch {
      flash(labels.copyFailed);
    }
  }

  const stopLabels: ColorStopTrackLabels = {
    color: labels.stopColor,
    position: labels.stopPosition,
    add: labels.addStop,
    remove: labels.removeStop,
    hint: labels.stopsHint,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] @2xl:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col items-center gap-3 xl:sticky xl:top-(--tool-sticky-top,1rem) xl:self-start @2xl:sticky @2xl:top-(--tool-sticky-top,1rem) @2xl:self-start">
        <GradientPreview state={state} sampleText={labels.sampleText} label={labels.preview} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <Button className="flex-1" onClick={shuffle}>
            <ShuffleIcon data-icon="inline-start" />
            {labels.shuffle}
          </Button>
          <Button variant="outline" className="flex-1" onClick={download}>
            <DownloadIcon data-icon="inline-start" />
            {labels.download}
          </Button>
          <Button variant="outline" onClick={copyCss}>
            <ClipboardIcon data-icon="inline-start" />
            {labels.copyCss}
          </Button>
          <ShareToXButton
            labels={shareLabels}
            tool="gradient-wallpaper-generator"
            title={labels.title}
            description={labels.description}
            url={shareUrl}
          />
        </div>
        {feedback ? <p className="text-sm text-primary" role="status">{feedback}</p> : null}

        <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{labels.cssLabel}</p>
          <code data-testid="gradient-css" className="block break-all font-mono text-xs text-foreground">
            {cssValue}
          </code>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel>{labels.type}</FieldLabel>
            <ToggleGroup
              data-testid="gradient-type"
              className="w-full flex-wrap"
              variant="outline"
              value={[state.type]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                if (nextValue === "conic" && !canUseConicGradient()) {
                  flash(labels.conicUnsupported);
                  return;
                }
                updateState({ type: nextValue as GradientState["type"] });
              }}
            >
              {gradientTypeIds.map((typeId) => (
                <ToggleGroupItem key={typeId} value={typeId}>
                  {labels.types[typeId]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          {state.type === "linear" || state.type === "conic" ? (
            <Field>
              <FieldLabel htmlFor="gradient-angle">
                {state.type === "linear" ? labels.angle : labels.conicAngle}
              </FieldLabel>
              <Input
                id="gradient-angle"
                data-testid="gradient-angle"
                type="number"
                min={0}
                max={359}
                value={state.angle}
                onChange={(event) => {
                  const numeric = Number(event.target.value);
                  if (!Number.isFinite(numeric)) return;
                  updateState({ angle: ((Math.round(numeric) % 360) + 360) % 360 });
                }}
              />
            </Field>
          ) : null}

          {state.type !== "linear" ? (
            <Field>
              <FieldLabel>{labels.center}</FieldLabel>
              <ToggleGroup
                data-testid="gradient-center"
                className="w-full flex-wrap"
                variant="outline"
                value={[state.center]}
                onValueChange={(value) => {
                  const nextValue = value[0];
                  if (!nextValue) return;
                  updateState({ center: nextValue as GradientState["center"] });
                }}
              >
                {centerPresets.map((preset) => (
                  <ToggleGroupItem key={preset.id} value={preset.id}>
                    {labels.centers[preset.id]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          ) : null}

          <Field>
            <FieldLabel>{labels.stops}</FieldLabel>
            <ColorStopTrack
              stops={state.stops}
              onChange={(stops) => updateState({ stops })}
              labels={stopLabels}
            />
          </Field>

          <Field>
            <FieldLabel>{labels.ratio}</FieldLabel>
            <ToggleGroup
              data-testid="gradient-ratio"
              className="w-full flex-wrap"
              variant="outline"
              value={[state.ratio]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                updateState({ ratio: nextValue as GradientState["ratio"] });
              }}
            >
              {gradientRatioIds.map((ratioId) => (
                <ToggleGroupItem key={ratioId} value={ratioId}>
                  {labels.ratios[ratioId]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.ratioHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="gradient-seed">{labels.seed}</FieldLabel>
            <Input
              id="gradient-seed"
              data-testid="gradient-seed"
              value={state.seed}
              onChange={(event) => {
                const seed = event.target.value;
                updateState({ seed, stops: buildPaletteFromSeed(seed) });
              }}
            />
            <FieldDescription>{labels.seedHint}</FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="gradient-show-text">{labels.showText}</FieldLabel>
            <input
              id="gradient-show-text"
              data-testid="gradient-show-text"
              type="checkbox"
              checked={state.showText}
              onChange={(event) => updateState({ showText: event.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            <FieldDescription>{labels.showTextHint}</FieldDescription>
          </Field>
        </FieldGroup>
      </div>
    </div>
  );
}
