"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { asciiBackgroundColors, asciiForegroundColors } from "../lib/palette";
import type { AsciiRenderResult } from "../lib/render";
import type { AsciiBackground } from "../lib/types";

export type AsciiPreviewLabels = {
  preview: string;
  empty: string;
  unsupported: string;
  width: string;
};

const baseFontSize = 14;
const charWidthRatio = 0.62;
const lineHeightRatio = 1.15;
const containerPadding = 24;

export function AsciiPreview({
  result,
  labels,
  colorize = false,
  background = "transparent",
}: {
  result: AsciiRenderResult;
  labels: AsciiPreviewLabels;
  colorize?: boolean;
  background?: AsciiBackground;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const rowCount = result.lines.length;
  const showColors = colorize && Boolean(result.colors?.length);
  const solidBackground = asciiBackgroundColors[background];
  const surfaceStyle: CSSProperties = solidBackground
    ? { backgroundColor: solidBackground, color: asciiForegroundColors[background] }
    : {};

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setBox({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** Scale the whole character grid to fit the panel — never scroll or crop. */
  const fontSize = useMemo(() => {
    const columns = Math.max(result.width, 1);
    const rows = Math.max(rowCount, 1);
    const naturalWidth = columns * baseFontSize * charWidthRatio;
    const naturalHeight = rows * baseFontSize * lineHeightRatio;
    if (box.width === 0 || box.height === 0) return baseFontSize;

    const availableWidth = Math.max(box.width - containerPadding, 1);
    const availableHeight = Math.max(box.height - containerPadding, 1);
    const scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
    return Math.max(2, Math.min(20, baseFontSize * scale));
  }, [box.height, box.width, result.width, rowCount]);

  return (
    <section
      aria-labelledby="ascii-preview-heading"
      className="flex h-[340px] flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 lg:h-[460px]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="ascii-preview-heading"
          data-testid="ascii-preview-heading"
          className="text-xs font-semibold tracking-tight text-primary"
        >
          {labels.preview}
        </h2>
        <span data-testid="ascii-width" className="text-[11px] text-muted-foreground">
          {result.width} {labels.width}
          {rowCount > 0 ? ` · ${rowCount}` : ""}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3"
        style={surfaceStyle}
        data-testid="ascii-preview"
        data-preview-background={background}
      >
        {rowCount > 0 ? (
          <pre
            aria-label={labels.preview}
            className={`m-0 max-w-full whitespace-pre font-mono ${showColors || solidBackground ? "" : "text-primary"}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeightRatio }}
          >
            {showColors
              ? result.lines.map((line, row) => (
                  <span key={row} className="block whitespace-pre">
                    {Array.from(line).map((char, column) => {
                      const color = result.colors?.[row]?.[column];
                      return color ? (
                        <span key={column} style={{ color }}>
                          {char}
                        </span>
                      ) : (
                        <span key={column}>{char}</span>
                      );
                    })}
                  </span>
                ))
              : result.lines.join("\n")}
          </pre>
        ) : (
          <p className={`m-auto text-sm ${solidBackground ? "opacity-80" : "text-muted-foreground"}`}>
            {labels.empty}
          </p>
        )}
      </div>

      {result.hasUnsupported ? (
        <p data-testid="ascii-unsupported" className="text-[11px] text-muted-foreground">
          {labels.unsupported}: {result.unsupported.join(" ")}
        </p>
      ) : null}
    </section>
  );
}
