"use client";

import { useEffect, useMemo, useRef } from "react";
import { renderGradientWallpaper } from "@/features/gradient-wallpaper-generator/lib/export";
import { getGradientWallpaperSize } from "@/features/gradient-wallpaper-generator/lib/sizes";
import type { GradientState } from "@/features/gradient-wallpaper-generator/lib/types";

export function GradientPreview({
  state,
  sampleText,
  label,
}: {
  state: GradientState;
  sampleText: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useMemo(() => getGradientWallpaperSize(state.ratio), [state.ratio]);
  const previewLongEdge = 480;
  const scale = previewLongEdge / Math.max(size.width, size.height);
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGradientWallpaper(canvas, state, width, height, sampleText);
  }, [state, width, height, sampleText]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="gradient-preview"
      style={{ aspectRatio: `${width} / ${height}` }}
      className="max-h-[70vh] w-auto max-w-full rounded-2xl border border-border bg-background"
      aria-label={label}
    />
  );
}
