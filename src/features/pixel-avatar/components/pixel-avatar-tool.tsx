"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { DownloadIcon, ShuffleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downloadCanvas } from "@/features/pixel-avatar/lib/export";
import {
  avatarExportSize,
  avatarStyles,
  generateAvatarDataUri,
} from "@/features/pixel-avatar/lib/generate-avatar";
import { avatarPalettes, getAvatarPalette } from "@/features/pixel-avatar/lib/palettes";
import { createSeed } from "@/lib/seeds";
import { trackEvent } from "@/lib/analytics";
import { getMessages } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { localizePath } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/config/site";

export type PixelAvatarState = {
  seed: string;
  style: string;
  palette: string;
};

export function PixelAvatarTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Messages["pixelAvatar"];
  initialState: PixelAvatarState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState(initialState);

  const shareLabels = getMessages(locale).share;
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/pixel-avatar")}`;
  const activePalette = getAvatarPalette(state.palette);
  const dataUri = useMemo(
    () => generateAvatarDataUri(state.seed, { styleId: state.style, paletteId: state.palette }),
    [state.palette, state.seed, state.style]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    canvas.width = avatarExportSize;
    canvas.height = avatarExportSize;

    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;

      context.fillStyle = activePalette.background;
      context.fillRect(0, 0, avatarExportSize, avatarExportSize);
      context.drawImage(image, 0, 0, avatarExportSize, avatarExportSize);
    };
    image.src = dataUri;

    return () => {
      cancelled = true;
    };
  }, [activePalette, dataUri]);

  function updateState(nextPartial: Partial<PixelAvatarState>) {
    const nextState = { ...state, ...nextPartial };
    setState(nextState);

    if (!shouldSyncUrl) return;
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), nextState);
  }

  function shuffle() {
    updateState({ seed: createSeed(10) });
    trackEvent({ name: "pixel_avatar_shuffled" });
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    downloadCanvas(canvas, `quirkbox-avatar-${state.seed}-${state.style}.png`);
    trackEvent({ name: "pixel_avatar_downloaded", metadata: { style: state.style } });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] @2xl:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={shuffle}
          aria-label={labels.shuffle}
          className="w-full max-w-72 cursor-pointer rounded-[2rem] border border-border bg-card p-4 shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <canvas
            ref={canvasRef}
            className="aspect-square w-full rounded-2xl border border-border bg-background"
            aria-label={labels.preview}
          />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <Button className="flex-1" onClick={shuffle}>
            <ShuffleIcon data-icon="inline-start" />
            {labels.shuffle}
          </Button>
          <Button variant="outline" className="flex-1" onClick={download}>
            <DownloadIcon data-icon="inline-start" />
            {labels.download}
          </Button>
          <ShareToXButton
            labels={shareLabels}
            tool="pixel-avatar"
            title={labels.title}
            description={labels.description}
            url={shareUrl}
          />
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel>{labels.style}</FieldLabel>
            <ToggleGroup
              className="w-full flex-wrap"
              variant="outline"
              value={[state.style]}
              onValueChange={(value) => {
                const nextValue = value[0];
                if (!nextValue) return;
                updateState({ style: nextValue });
              }}
            >
              {avatarStyles.map((styleId) => (
                <ToggleGroupItem key={styleId} value={styleId}>
                  {labels.styles[styleId]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>{labels.styleHint}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{labels.palette}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {avatarPalettes.map((palette) => {
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
            <FieldLabel htmlFor="pixel-avatar-seed">{labels.seed}</FieldLabel>
            <Input
              id="pixel-avatar-seed"
              value={state.seed}
              onChange={(event) => updateState({ seed: event.target.value })}
            />
            <FieldDescription>{labels.seedHint}</FieldDescription>
          </Field>
        </FieldGroup>
      </div>
    </div>
  );
}
