"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { ChevronDownIcon, DownloadIcon, ShuffleIcon, SlidersHorizontalIcon, SmilePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmojiLibrary } from "@/features/emoji-wallpaper/components/emoji-library";
import {
  emojiThemeIds,
  emojiThemes,
  getEmojiThemeEmojis,
  maxEmojiInputCount,
  splitEmojiInput,
} from "@/features/emoji-wallpaper/lib/emoji-sets";
import {
  emojiColumnOptions,
  emojiFormatIds,
  emojiPatternIds,
  emojiToneIds,
  normalizeEmojiColumns,
  normalizeEmojiFormat,
  normalizeEmojiPattern,
  normalizeEmojiTone,
} from "@/features/emoji-wallpaper/lib/patterns";
import { getWallpaperPalette, wallpaperPalettes } from "@/features/emoji-wallpaper/lib/palettes";
import { getWallpaperSize, wallpaperRatioIds } from "@/features/emoji-wallpaper/lib/ratios";
import { exportWallpaper, renderEmojiWallpaper } from "@/features/emoji-wallpaper/lib/render";
import { createSeed } from "@/lib/seeds";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";

export type EmojiWallpaperState = {
  seed: string;
  theme: string;
  emoji: string;
  pattern: string;
  ratio: string;
  columns: number;
  palette: string;
  tone: string;
  format: string;
};

export function EmojiWallpaperTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Messages["emojiWallpaper"];
  initialState: EmojiWallpaperState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState(initialState);
  const [rendering, setRendering] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const selectedEmojis = useMemo(() => splitEmojiInput(state.emoji), [state.emoji]);
  const usingCustomEmojis = selectedEmojis.length > 0;
  const activePalette = getWallpaperPalette(state.palette);
  const emojiPool = useMemo(
    () => (usingCustomEmojis ? selectedEmojis : getEmojiThemeEmojis(state.theme)),
    [selectedEmojis, usingCustomEmojis, state.theme]
  );
  const { previewWidth, previewHeight } = useMemo(() => {
    const size = getWallpaperSize(state.ratio);
    const previewLongEdge = 480;
    const scale = previewLongEdge / Math.max(size.width, size.height);
    return {
      previewWidth: Math.round(size.width * scale),
      previewHeight: Math.round(size.height * scale),
    };
  }, [state.ratio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderEmojiWallpaper(canvas, {
      emojiPool,
      seed: state.seed,
      width: previewWidth,
      height: previewHeight,
      columns: state.columns,
      pattern: normalizeEmojiPattern(state.pattern),
      background: activePalette.background,
      swatch: activePalette.swatch,
      tone: normalizeEmojiTone(state.tone),
    });
  }, [
    emojiPool,
    state.seed,
    state.columns,
    state.pattern,
    state.ratio,
    state.palette,
    state.tone,
    previewWidth,
    previewHeight,
    activePalette,
  ]);

  function updateState(nextPartial: Partial<EmojiWallpaperState>) {
    const nextState = { ...state, ...nextPartial };
    setState(nextState);

    if (!shouldSyncUrl) return;
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), {
      seed: nextState.seed,
      theme: nextState.theme,
      emoji: nextState.emoji,
      pattern: nextState.pattern,
      ratio: nextState.ratio,
      columns: String(nextState.columns),
      palette: nextState.palette,
      tone: nextState.tone,
    });
  }

  function applyPreset(themeId: string) {
    updateState({ theme: themeId, emoji: "" });
    trackEvent({ name: "emoji_wallpaper_preset_applied", metadata: { theme: themeId } });
  }

  function toggleEmoji(emoji: string) {
    const nextEmojis = selectedEmojis.includes(emoji)
      ? selectedEmojis.filter((item) => item !== emoji)
      : [...selectedEmojis, emoji].slice(0, maxEmojiInputCount);

    updateState({ emoji: nextEmojis.join("") });
  }

  function shuffle() {
    updateState({ seed: createSeed(10) });
    trackEvent({ name: "emoji_wallpaper_shuffled" });
  }

  function download() {
    if (rendering) return;
    setRendering(true);
    requestAnimationFrame(() => {
      const size = getWallpaperSize(state.ratio);
      exportWallpaper({
        emojiPool,
        seed: state.seed,
        width: size.width,
        height: size.height,
        columns: state.columns,
        pattern: normalizeEmojiPattern(state.pattern),
        background: activePalette.background,
        swatch: activePalette.swatch,
        tone: normalizeEmojiTone(state.tone),
        ratio: state.ratio,
        format: normalizeEmojiFormat(state.format),
      });
      trackEvent({
        name: "emoji_wallpaper_downloaded",
        metadata: { ratio: state.ratio, pattern: state.pattern },
      });
      setRendering(false);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] @2xl:grid-cols-[0.9fr_1.1fr]">
      {/* `self-start` is what gives the preview room to move inside its grid area — a stretched
          grid item is as tall as the controls column, so sticky would have nowhere to travel. */}
      <div className="flex flex-col items-center gap-3 xl:sticky xl:top-[var(--tool-sticky-top,1rem)] xl:self-start @2xl:sticky @2xl:top-[var(--tool-sticky-top,1rem)] @2xl:self-start">
        <canvas
          ref={canvasRef}
          style={{ aspectRatio: `${previewWidth} / ${previewHeight}` }}
          className="max-h-[70vh] w-auto max-w-full rounded-2xl border border-border bg-background"
          aria-label={labels.preview}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <Button className="flex-1" onClick={shuffle}>
            <ShuffleIcon data-icon="inline-start" />
            {labels.shuffle}
          </Button>
          <Button variant="outline" className="flex-1" onClick={download} disabled={rendering}>
            <DownloadIcon data-icon="inline-start" />
            {rendering ? labels.rendering : labels.download}
          </Button>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel>{labels.theme}</FieldLabel>
            <ToggleGroup
              className="w-full flex-wrap gap-2"
              variant="outline"
              value={usingCustomEmojis ? [] : [state.theme]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                applyPreset(nextValue);
              }}
            >
              {emojiThemeIds.map((themeId) => (
                <ToggleGroupItem key={themeId} value={themeId} className="h-auto flex-col gap-1 px-3 py-2">
                  <span aria-hidden="true" className="text-base leading-none">
                    {emojiThemes[themeId].slice(0, 4).join("")}
                  </span>
                  <span className="text-xs">{labels.themes[themeId]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.themeHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.emoji}</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {usingCustomEmojis ? (
                selectedEmojis.map((emoji) => (
                  <span
                    key={emoji}
                    className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-lg"
                  >
                    {emoji}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{labels.emojiUsingPreset}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-expanded={libraryOpen}
                onClick={() => setLibraryOpen((open) => !open)}
              >
                <SmilePlusIcon data-icon="inline-start" />
                {labels.emojiBrowse}
              </Button>
              {usingCustomEmojis ? (
                <Button variant="ghost" size="sm" onClick={() => updateState({ emoji: "" })}>
                  {labels.emojiReset}
                </Button>
              ) : null}
            </div>
            {libraryOpen ? <EmojiLibrary locale={locale} labels={labels} onSelect={toggleEmoji} /> : null}
            <FieldDescription>{labels.emojiHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.pattern}</FieldLabel>
            <ToggleGroup
              className="w-full flex-wrap"
              variant="outline"
              value={[state.pattern]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                updateState({ pattern: nextValue });
              }}
            >
              {emojiPatternIds.map((patternId) => (
                <ToggleGroupItem key={patternId} value={patternId}>
                  {labels.patterns[patternId]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.patternHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.ratio}</FieldLabel>
            <ToggleGroup
              className="w-full flex-wrap"
              variant="outline"
              value={[state.ratio]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                updateState({ ratio: nextValue });
              }}
            >
              {wallpaperRatioIds.map((ratioId) => (
                <ToggleGroupItem key={ratioId} value={ratioId}>
                  {labels.ratios[ratioId]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.ratioHint}</FieldDescription>
          </Field>

          <Collapsible>
            <CollapsibleTrigger>
              <span className="flex items-center gap-2">
                <SlidersHorizontalIcon data-icon="inline-start" />
                {labels.advanced}
              </span>
              <ChevronDownIcon
                data-icon="inline-end"
                className="transition-transform group-data-[panel-open]/collapsible-trigger:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <Field>
                <FieldLabel>{labels.palette}</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {wallpaperPalettes.map((palette) => {
                    const active = palette.id === activePalette.id;

                    return (
                      <button
                        key={palette.id}
                        type="button"
                        aria-label={labels.palettes[palette.id]}
                        aria-pressed={active}
                        title={labels.palettes[palette.id]}
                        onClick={() => updateState({ palette: palette.id })}
                        style={{ backgroundColor: palette.swatch }}
                        className={cn(
                          "size-9 cursor-pointer rounded-full border-2 transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          active ? "border-foreground" : "border-transparent"
                        )}
                      />
                    );
                  })}
                </div>
              </Field>

              <Field>
                <FieldLabel>{labels.tone}</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  variant="outline"
                  value={[state.tone]}
                  onValueChange={(value) => {
                    const nextValue = value[0];
                    if (!nextValue) return;
                    updateState({ tone: nextValue });
                  }}
                >
                  {emojiToneIds.map((toneId) => (
                    <ToggleGroupItem key={toneId} value={toneId}>
                      {labels.tones[toneId]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>{labels.columns}</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  variant="outline"
                  value={[String(state.columns)]}
                  onValueChange={(value) => {
                    const nextValue = value[0];
                    if (!nextValue) return;
                    updateState({ columns: normalizeEmojiColumns(nextValue) });
                  }}
                >
                  {emojiColumnOptions.map((option) => (
                    <ToggleGroupItem key={option} value={String(option)}>
                      {labels.columnOptions[String(option) as keyof typeof labels.columnOptions]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>{labels.columnsHint}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>{labels.format}</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  variant="outline"
                  value={[state.format]}
                  onValueChange={(value) => {
                    const nextValue = value[0];
                    if (!nextValue) return;
                    updateState({ format: nextValue });
                  }}
                >
                  {emojiFormatIds.map((formatId) => (
                    <ToggleGroupItem key={formatId} value={formatId}>
                      {labels.formats[formatId]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="emoji-wallpaper-seed">{labels.seed}</FieldLabel>
                <Input
                  id="emoji-wallpaper-seed"
                  value={state.seed}
                  onChange={(event) => updateState({ seed: event.target.value })}
                />
                <FieldDescription>{labels.seedHint}</FieldDescription>
              </Field>
            </CollapsiblePanel>
          </Collapsible>
        </FieldGroup>
      </div>
    </div>
  );
}
