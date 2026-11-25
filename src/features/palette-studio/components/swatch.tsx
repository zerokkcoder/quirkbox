"use client";

import type { Messages } from "@/lib/i18n";
import { withHash } from "@/features/palette-studio/lib/color";
import { bestForeground, contrastOnBlack, contrastOnWhite, wcagLevel } from "@/features/palette-studio/lib/contrast";

export function Swatch({
  hex,
  index,
  labels,
  onCopy,
}: {
  hex: string;
  index: number;
  labels: Messages["paletteStudio"];
  onCopy: (hex: string) => void;
}) {
  const whiteRatio = contrastOnWhite(hex);
  const blackRatio = contrastOnBlack(hex);
  const level = wcagLevel(Math.max(whiteRatio, blackRatio));

  return (
    <button
      type="button"
      data-testid={`palette-swatch-${index}`}
      onClick={() => onCopy(hex)}
      aria-label={`${withHash(hex)} — ${labels.copyHint}`}
      style={{ backgroundColor: withHash(hex), color: bestForeground(hex) }}
      className="flex min-h-36 flex-1 cursor-pointer flex-col justify-between rounded-xl border border-border/70 p-3 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="text-xs font-medium opacity-80">#{index + 1}</span>
      <span className="font-mono text-sm font-semibold tracking-tight">{withHash(hex)}</span>
      <span className="flex flex-col gap-0.5 text-[11px] leading-4 opacity-90">
        <span>
          {labels.contrast.white} {whiteRatio.toFixed(1)}:1
        </span>
        <span>
          {labels.contrast.black} {blackRatio.toFixed(1)}:1
        </span>
        <span className="font-semibold">WCAG {level}</span>
      </span>
    </button>
  );
}
