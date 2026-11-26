"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CopyIcon, DownloadIcon, Link2Icon, ShuffleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { Swatch } from "@/features/palette-studio/components/swatch";
import { downloadCanvas } from "@/features/pixel-avatar/lib/export";
import { normalizeHex, withHash } from "@/features/palette-studio/lib/color";
import {
  normalizeSimulation,
  simulatePalette,
  simulationIds,
  type SimulationId,
} from "@/features/palette-studio/lib/color-blind";
import { bestForeground } from "@/features/palette-studio/lib/contrast";
import { cssVariables, paletteFilename, paletteJson, tailwindTheme } from "@/features/palette-studio/lib/export";
import {
  getPreset,
  palettePresets,
  resolvePalette,
} from "@/features/palette-studio/lib/presets";
import {
  harmonyIds,
  maxSwatchCount,
  minSwatchCount,
  type PaletteState,
  type PresetId,
} from "@/features/palette-studio/lib/types";
import { createSeed, hashSeed } from "@/lib/seeds";
import { trackEvent } from "@/lib/analytics";
import { getMessages, type Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { localizePath } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site";

export function PaletteStudioTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Messages["paletteStudio"];
  initialState: PaletteState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);
  const [simulation, setSimulation] = useState<SimulationId>("none");
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number | null>(null);

  const palette = useMemo(() => resolvePalette(state), [state]);
  const displayed = useMemo(() => simulatePalette(palette, simulation), [palette, simulation]);
  const shareParams = new URLSearchParams({
    color: state.color,
    harmony: state.harmony,
    count: String(state.count),
  });
  if (state.preset) shareParams.set("preset", state.preset);
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/color-palette-generator")}?${shareParams.toString()}`;

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function showFeedback(message: string) {
    setFeedback(message);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFeedback(""), 4000);
  }

  function updateState(next: Partial<PaletteState>) {
    const nextState = { ...state, ...next };
    setState(nextState);

    if (!shouldSyncUrl) return;
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), {
      color: nextState.color,
      harmony: nextState.harmony,
      count: String(nextState.count),
      preset: nextState.preset ?? undefined,
    });
  }

  async function copy(text: string, eventName = "palette_copied") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      showFeedback(labels.copied);
      trackEvent({ name: eventName });
    } catch {
      showFeedback(labels.copyFailed);
    }
  }

  function applyPreset(id: PresetId) {
    const preset = getPreset(id);
    if (!preset) return;

    updateState({ preset: id, color: preset.seed, harmony: preset.harmony });
    showFeedback(`${labels.presets.applied}${labels.presetNames[id]}`);
    trackEvent({ name: "palette_preset_applied", metadata: { preset: id } });
  }

  function shuffle() {
    const hex = hashSeed(createSeed(8)).toString(16).padStart(6, "0").slice(0, 6);
    updateState({ color: hex, preset: undefined });
    trackEvent({ name: "palette_shuffled" });
  }

  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 420;
    const context = canvas.getContext("2d");
    if (!context) return;

    const swatchWidth = canvas.width / palette.length;
    palette.forEach((hex, index) => {
      context.fillStyle = withHash(hex);
      context.fillRect(index * swatchWidth, 0, swatchWidth, 320);
      context.fillStyle = bestForeground(hex);
      context.font = "600 24px monospace";
      context.fillText(withHash(hex), index * swatchWidth + 18, 292);
    });

    const presetLabel = state.preset ? `${labels.presetNames[state.preset]} · ` : "";
    context.fillStyle = "#0b1020";
    context.fillRect(0, 320, canvas.width, 100);
    context.fillStyle = "#e6e8f0";
    context.font = "500 22px sans-serif";
    context.fillText(
      `starrudder.cc · ${presetLabel}${state.harmony} · ${withHash(state.color)}`,
      20,
      382
    );

    downloadCanvas(canvas, paletteFilename(state.color));
    trackEvent({ name: "palette_downloaded" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {state.preset ? labels.presetNames[state.preset] : labels.presets.custom}
          </span>
          <span className="text-xs text-muted-foreground">{labels.presets.hint}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={shuffle}>
            <ShuffleIcon data-icon="inline-start" />
            {labels.shuffle}
          </Button>
          <Button onClick={() => copy(palette.map(withHash).join("\n"), "palette_all_copied")}>
            <CopyIcon data-icon="inline-start" />
            {labels.copyAll}
          </Button>
        </div>
      </div>

      <div data-testid="palette-strip" className="flex flex-col gap-2 sm:flex-row">
        {displayed.map((hex, index) => (
          <Swatch
            key={`${index}-${hex}`}
            hex={hex}
            index={index}
            labels={labels}
            onCopy={(value) => copy(value, "palette_hex_copied")}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels.copyHint}</p>

      <section
        aria-labelledby="palette-presets-heading"
        className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
      >
        <h2 id="palette-presets-heading" className="text-sm font-semibold tracking-tight text-primary">
          {labels.presets.title}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {palettePresets.map((preset) => {
            const active = state.preset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`palette-preset-${preset.id}`}
                aria-pressed={active}
                onClick={() => applyPreset(preset.id)}
                className={`flex flex-col gap-2 rounded-xl border p-2 text-left transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : "border-border/70 hover:-translate-y-0.5 hover:border-primary/60"
                }`}
              >
                <span className="flex h-7 overflow-hidden rounded-md border border-border/40">
                  {preset.colors.slice(0, 3).map((hex, index) => (
                    <span key={index} className="flex-1" style={{ backgroundColor: withHash(hex) }} />
                  ))}
                </span>
                <span className="truncate text-xs font-medium">{labels.presetNames[preset.id]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <FieldGroup>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{labels.fineTune}</p>

          <Field>
            <FieldLabel htmlFor="palette-seed-input">{labels.seed}</FieldLabel>
            <div className="flex gap-2">
              <input
                type="color"
                data-testid="palette-seed-picker"
                aria-label={labels.seed}
                value={withHash(state.color)}
                onChange={(event) =>
                  updateState({ color: normalizeHex(event.target.value), preset: undefined })
                }
                className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
              />
              <Input
                id="palette-seed-input"
                data-testid="palette-seed-input"
                value={withHash(state.color)}
                onChange={(event) =>
                  updateState({
                    color: normalizeHex(event.target.value, state.color),
                    preset: undefined,
                  })
                }
              />
            </div>
            <FieldDescription>{labels.seedHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.harmony}</FieldLabel>
            <ToggleGroup
              className="w-full flex-wrap"
              variant="outline"
              value={[state.harmony]}
              onValueChange={(value) => {
                if (value[0]) {
                  updateState({
                    harmony: value[0] as PaletteState["harmony"],
                    preset: undefined,
                  });
                }
              }}
            >
              {harmonyIds.map((id) => (
                <ToggleGroupItem key={id} value={id} data-testid={`palette-harmony-${id}`}>
                  {labels.harmonyNames[id]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.harmonyHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="palette-count">{labels.count}</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                id="palette-count"
                data-testid="palette-count"
                type="range"
                min={minSwatchCount}
                max={maxSwatchCount}
                value={state.count}
                onChange={(event) => updateState({ count: Number(event.target.value) })}
                className="w-full accent-primary"
              />
              <span className="w-6 text-center font-mono text-sm">{state.count}</span>
            </div>
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-primary">{labels.contrast.title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{labels.contrast.hint}</p>
            <h3 className="mt-4 text-xs font-semibold tracking-tight">{labels.simulation.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{labels.simulation.hint}</p>
            <ToggleGroup
              className="mt-3 w-full flex-wrap"
              variant="outline"
              size="sm"
              value={[simulation]}
              onValueChange={(value) => {
                if (value[0]) setSimulation(normalizeSimulation(value[0]));
              }}
            >
              {simulationIds.map((id) => (
                <ToggleGroupItem key={id} value={id} data-testid={`palette-simulation-${id}`}>
                  {labels.simulation[id]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={() => copy(cssVariables(palette))}>
              <CopyIcon data-icon="inline-start" />
              {labels.copyCss}
            </Button>
            <Button variant="outline" onClick={() => copy(tailwindTheme(palette))}>
              <CopyIcon data-icon="inline-start" />
              {labels.copyTailwind}
            </Button>
            <Button variant="outline" onClick={() => copy(paletteJson(state, palette))}>
              <CopyIcon data-icon="inline-start" />
              {labels.copyJson}
            </Button>
            <Button variant="outline" onClick={() => copy(shareUrl, "palette_link_copied")}>
              <Link2Icon data-icon="inline-start" />
              {labels.copyLink}
            </Button>
            <Button variant="outline" onClick={download}>
              <DownloadIcon data-icon="inline-start" />
              {labels.downloadPng}
            </Button>
            <ShareToXButton
              labels={getMessages(locale).share}
              tool="color-palette-generator"
              title={labels.title}
              description={labels.description}
              url={shareUrl}
            />
          </div>
        </div>
      </div>

      <span role="status" data-testid="palette-feedback" className="text-xs text-muted-foreground">
        {feedback}
      </span>
    </div>
  );
}
