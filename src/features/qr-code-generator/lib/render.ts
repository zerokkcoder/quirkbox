import {
  maxLogoRatio,
  minContrastRatio,
  quietZone,
  type DotStyle,
  type QrMatrix,
} from "./types";

/** Relative luminance of a `#rrggbb` color (WCAG 2.1). */
export function luminance(hex: string): number {
  const raw = hex.replace(/^#/, "");
  const channel = (offset: number) => {
    const value = parseInt(raw.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function hasLowContrast(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) < minContrastRatio;
}

export type RenderOptions = {
  foreground: string;
  background: string;
  dots: DotStyle;
  transparent: boolean;
  logo?: HTMLImageElement | null;
};

function drawModule(
  context: CanvasRenderingContext2D,
  dots: DotStyle,
  x: number,
  y: number,
  size: number
) {
  if (dots === "dots") {
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }

  if (dots === "rounded") {
    const radius = size * 0.35;
    context.beginPath();
    context.roundRect(x, y, size, size, radius);
    context.fill();
    return;
  }

  context.fillRect(x, y, size, size);
}

/**
 * Paint a QR matrix onto a canvas. A fixed 4-module quiet zone is always kept.
 * The logo is capped at 1/5 of the code width and drawn on an opaque plate so
 * the modules underneath stay readable by a scanner.
 */
export function renderQr(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  options: RenderOptions
): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  const total = matrix.count + quietZone * 2;
  const moduleSize = canvas.width / total;
  const scale = moduleSize;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!options.transparent) {
    context.fillStyle = `#${options.background.replace(/^#/, "")}`;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.fillStyle = `#${options.foreground.replace(/^#/, "")}`;
  for (let row = 0; row < matrix.count; row += 1) {
    for (let col = 0; col < matrix.count; col += 1) {
      if (!matrix.cells[row][col]) continue;
      const x = (col + quietZone) * scale;
      const y = (row + quietZone) * scale;
      drawModule(context, options.dots, x, y, scale);
    }
  }

  if (!options.logo) return;

  const logoWidth = canvas.width * maxLogoRatio;
  const ratio = options.logo.naturalWidth && options.logo.naturalHeight
    ? options.logo.naturalWidth / options.logo.naturalHeight
    : 1;
  const logoHeight = logoWidth / ratio;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const platePadding = moduleSize * 1.2;

  // Opaque plate hides the modules a logo would otherwise corrupt.
  context.fillStyle = options.transparent ? "#ffffff" : `#${options.background.replace(/^#/, "")}`;
  context.beginPath();
  context.roundRect(
    centerX - logoWidth / 2 - platePadding,
    centerY - logoHeight / 2 - platePadding,
    logoWidth + platePadding * 2,
    logoHeight + platePadding * 2,
    moduleSize * 1.5
  );
  context.fill();

  context.drawImage(
    options.logo,
    centerX - logoWidth / 2,
    centerY - logoHeight / 2,
    logoWidth,
    logoHeight
  );
}
