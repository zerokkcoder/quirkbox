"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { DownloadIcon, ShuffleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackEvent } from "@/lib/analytics";
import { replaceSearchState } from "@/lib/url-state";
import { downloadCanvas } from "@/features/pixel-avatar/lib/export";
import { avatarBackgrounds, avatarPalettes } from "@/features/pixel-avatar/lib/palettes";
import { createSeed } from "@/features/pixel-avatar/lib/seeds";
import { drawPixelAvatar, generatePixelAvatarRecipe } from "@/features/pixel-avatar/lib/generate-avatar";
import type { Messages } from "@/lib/i18n";

type PixelAvatarState = {
  seed: string;
  palette: string;
  background: string;
  size: string;
};

export function PixelAvatarTool({
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  labels: Messages["pixelAvatar"];
  initialState: PixelAvatarState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState(initialState);

  const recipe = useMemo(
    () => generatePixelAvatarRecipe(state.seed, { paletteId: state.palette, background: state.background }),
    [state.background, state.palette, state.seed]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const size = Number(state.size);
    canvas.width = size;
    canvas.height = size;
    drawPixelAvatar(context, recipe, size);
  }, [recipe, state.size]);

  function syncUrl(nextState: PixelAvatarState) {
    if (!shouldSyncUrl) return;
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), nextState);
  }

  function updateState(nextPartial: Partial<PixelAvatarState>) {
    const nextState = { ...state, ...nextPartial };
    setState(nextState);
    syncUrl(nextState);
  }

  return (
    <Tabs defaultValue="builder" className="flex flex-col gap-6">
      <TabsList>
        <TabsTrigger value="builder">{labels.tabBuilder}</TabsTrigger>
        <TabsTrigger value="traits">{labels.tabTraits}</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="flex flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] @2xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>{labels.preview}</CardTitle>
              <CardDescription>{labels.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
              <div className="w-full max-w-80 rounded-[2rem] border border-border bg-card p-4 shadow-sm">
                <canvas
                  ref={canvasRef}
                  className="aspect-square w-full rounded-2xl border border-border bg-background [image-rendering:pixelated]"
                  aria-label={labels.preview}
                />
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const nextState = { ...state, seed: createSeed(10) };
                    updateState(nextState);
                    trackEvent({ name: "pixel_avatar_randomized" });
                  }}
                >
                  <ShuffleIcon data-icon="inline-start" />
                  {labels.randomize}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!canvasRef.current) return;
                    downloadCanvas(canvasRef.current, `quirkbox-avatar-${state.seed}.png`);
                    trackEvent({ name: "pixel_avatar_downloaded", metadata: { size: state.size } });
                  }}
                >
                  <DownloadIcon data-icon="inline-start" />
                  {labels.download}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{labels.seed}</CardTitle>
              <CardDescription>{labels.seedHint}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>{labels.seed}</FieldLabel>
                  <Input value={state.seed} onChange={(event) => updateState({ seed: event.target.value })} />
                </Field>
                <Field>
                  <FieldLabel>{labels.palette}</FieldLabel>
                  <Select
                    items={avatarPalettes.map((palette) => ({ value: palette.id, label: labels.palettes[palette.id] }))}
                    value={state.palette}
                    onValueChange={(value) => {
                      if (!value) return;
                      updateState({ palette: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={labels.palette} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {avatarPalettes.map((palette) => (
                          <SelectItem key={palette.id} value={palette.id}>
                            {labels.palettes[palette.id]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>{labels.background}</FieldLabel>
                  <Select
                    items={avatarBackgrounds.map((background) => ({ value: background, label: labels.backgrounds[background] }))}
                    value={state.background}
                    onValueChange={(value) => {
                      if (!value) return;
                      updateState({ background: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={labels.background} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {avatarBackgrounds.map((background) => (
                          <SelectItem key={background} value={background}>
                            {labels.backgrounds[background]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>{labels.size}</FieldLabel>
                  <ToggleGroup
                    variant="outline"
                    value={[state.size]}
                    onValueChange={(value) => {
                      const nextValue = value[0];
                      if (!nextValue) return;
                      updateState({ size: nextValue });
                    }}
                  >
                    {["128", "256", "512"].map((size) => (
                      <ToggleGroupItem key={size} value={size}>
                        {size}px
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>{labels.sizeHint}</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="traits">
        <Card>
          <CardHeader>
            <CardTitle>{labels.traits}</CardTitle>
            <CardDescription>{labels.traitsHint}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">{labels.traitValues[recipe.hairStyle]}</Badge>
            <Badge variant="secondary">{labels.traitValues[recipe.eyeStyle]}</Badge>
            <Badge variant="secondary">{labels.traitValues[recipe.mouthStyle]}</Badge>
            <Badge variant="secondary">{labels.traitValues[recipe.accessory]}</Badge>
            <Badge variant="secondary">{labels.backgrounds[recipe.background]}</Badge>
            <Badge variant="secondary">{labels.palettes[recipe.paletteId]}</Badge>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
