"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { renderQr, type RenderOptions } from "@/features/qr-code-generator/lib/render";
import type { DotStyle, LogoData, QrMatrix } from "@/features/qr-code-generator/lib/types";

export type QrPreviewLabels = {
  preview: string;
  downloadPng: string;
  downloadSvg: string;
  empty: string;
  tooLong: string;
  lowContrast: string;
  logoHint: string;
};

export function QrPreview({
  canvasRef: externalCanvasRef,
  matrix,
  size,
  foreground,
  background,
  dots,
  transparent,
  logo,
  labels,
  warnings,
  onDownloadPng,
  onDownloadSvg,
}: {
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  matrix: QrMatrix | null;
  size: number;
  foreground: string;
  background: string;
  dots: DotStyle;
  transparent: boolean;
  logo: LogoData | null;
  labels: QrPreviewLabels;
  warnings: { tooLong: boolean; lowContrast: boolean };
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
}) {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef ?? localCanvasRef;
  const [loadedLogo, setLoadedLogo] = useState<{
    dataUrl: string;
    image: HTMLImageElement;
  } | null>(null);

  // Only the async onload callback sets state; matching by dataUrl means a new
  // logo (or its removal) never needs a synchronous reset inside the effect.
  const logoImage = logo && loadedLogo?.dataUrl === logo.dataUrl ? loadedLogo.image : null;

  useEffect(() => {
    if (!logo) return;
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (!cancelled) setLoadedLogo({ dataUrl: logo.dataUrl, image });
    };
    image.src = logo.dataUrl;
    return () => {
      cancelled = true;
    };
  }, [logo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    const options: RenderOptions = {
      foreground,
      background,
      dots,
      transparent,
      logo: logoImage,
    };
    try {
      renderQr(canvas, matrix, options);
    } catch {
      // Older browsers without roundRect: the plain-square path still works in
      // renderQr only for `square`; surface nothing rather than crash the page.
    }
  }, [matrix, size, foreground, background, dots, transparent, logoImage, canvasRef]);

  const warningText = warnings.tooLong
    ? labels.tooLong
    : warnings.lowContrast
      ? labels.lowContrast
      : logo
        ? labels.logoHint
        : "";

  return (
    <section
      aria-labelledby="qr-preview-heading"
      className="flex h-[340px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 lg:h-[460px]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <h2 id="qr-preview-heading" className="text-xs font-semibold tracking-tight text-primary">
          {labels.preview}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {matrix ? `${matrix.count}×${matrix.count}` : ""}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
        <canvas
          ref={canvasRef}
          data-testid="qr-preview-canvas"
          width={size}
          height={size}
          className="aspect-square h-auto max-h-[240px] w-auto max-w-full rounded-lg bg-white shadow-sm lg:max-h-[320px]"
          aria-label={labels.preview}
          hidden={!matrix}
        />
        {!matrix ? <p className="text-sm text-muted-foreground">{labels.empty}</p> : null}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button data-testid="qr-download-png" size="sm" disabled={!matrix} onClick={onDownloadPng}>
            {labels.downloadPng}
          </Button>
          <Button
            data-testid="qr-download-svg"
            size="sm"
            variant="outline"
            disabled={!matrix}
            onClick={onDownloadSvg}
          >
            {labels.downloadSvg}
          </Button>
        </div>

        {warningText ? (
          <p data-testid="qr-warning" className="max-w-[22rem] text-center text-[11px] leading-4 text-amber-600 dark:text-amber-400">
            {warningText}
          </p>
        ) : null}
      </div>
    </section>
  );
}
