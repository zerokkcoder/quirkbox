import type { AsciiRenderResult } from "./render";
import {
  maxWidth,
  normalizeBrightness,
  normalizeContrast,
  normalizeWidth,
  type DitherId,
  type RampId,
} from "./types";

/** Canvas-shaped pixel buffer; kept independent of DOM ImageData for easy testing. */
export type ImageGrid = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type ImageRenderOptions = {
  width: number;
  ramp: RampId;
  brightness: number;
  contrast: number;
  invert: boolean;
  dither: DitherId;
};

export type ImageRenderResult = AsciiRenderResult & {
  rows: number;
  /** Number of source pixels sampled per character cell. */
  cellWidth: number;
  cellHeight: number;
};

/** Dark → light. `braille` is handled separately as a 2×4 dot cell. */
const ramps: Record<Exclude<RampId, "braille">, string> = {
  classic: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  matrix: "01",
  minimal: "@*=-. ",
};

const brailleDots = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 3],
  [1, 3],
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function sampleCell(grid: ImageGrid, x: number, y: number, cellW: number, cellH: number) {
  const startX = Math.floor(x);
  const endX = Math.min(grid.width, Math.max(startX + 1, Math.ceil(x + cellW)));
  const startY = Math.floor(y);
  const endY = Math.min(grid.height, Math.max(startY + 1, Math.ceil(y + cellH)));

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let count = 0;

  for (let sy = startY; sy < endY; sy += 1) {
    for (let sx = startX; sx < endX; sx += 1) {
      const index = (sy * grid.width + sx) * 4;
      const alpha = (grid.data[index + 3] ?? 255) / 255;
      r += (grid.data[index] ?? 0) * alpha;
      g += (grid.data[index + 1] ?? 0) * alpha;
      b += (grid.data[index + 2] ?? 0) * alpha;
      a += alpha;
      count += 1;
    }
  }

  if (count === 0) return { red: 255, green: 255, blue: 255, luminance: 255 };

  // Composite transparency over white so transparent PNGs stay readable.
  const red = clamp(Math.round(r / count + 255 * (1 - a / count)), 0, 255);
  const green = clamp(Math.round(g / count + 255 * (1 - a / count)), 0, 255);
  const blue = clamp(Math.round(b / count + 255 * (1 - a / count)), 0, 255);
  return {
    red,
    green,
    blue,
    luminance: 0.2126 * red + 0.7152 * green + 0.0722 * blue,
  };
}

function adjust(value: number, brightness: number, contrast: number, invert: boolean): number {
  let next = (value - 128) * contrast + 128 + brightness;
  if (invert) next = 255 - next;
  return clamp(next, 0, 255);
}

/** Floyd–Steinberg error diffusion over the already downsampled luminance grid. */
function dither(values: Float64Array, width: number, height: number, levels: number): void {
  const stride = Math.max(1, levels - 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = values[index] ?? 0;
      const quantized = (Math.round((oldValue / 255) * stride) / stride) * 255;
      values[index] = quantized;
      const error = oldValue - quantized;
      const right = x + 1 < width ? index + 1 : -1;
      const below = y + 1 < height ? index + width : -1;
      if (right >= 0) values[right] = (values[right] ?? 0) + (error * 7) / 16;
      if (below >= 0) {
        values[below] = (values[below] ?? 0) + (error * 5) / 16;
        if (x > 0) values[below - 1] = (values[below - 1] ?? 0) + (error * 3) / 16;
        if (x + 1 < width) values[below + 1] = (values[below + 1] ?? 0) + (error * 1) / 16;
      }
    }
  }
}

function cellColor(red: number, green: number, blue: number): string {
  return `rgb(${red},${green},${blue})`;
}

/**
 * Convert local pixel data to a character grid. Pure and deterministic:
 * identical pixels + options always produce identical lines.
 */
export function renderImageAscii(grid: ImageGrid, options: ImageRenderOptions): ImageRenderResult {
  if (grid.width <= 0 || grid.height <= 0 || grid.data.length < grid.width * grid.height * 4) {
    return { lines: [], width: 0, rows: 0, cellWidth: 1, cellHeight: 2, hasUnsupported: false, unsupported: [] };
  }

  const cols = normalizeWidth(options.width);
  const rows = clamp(Math.round((cols * grid.height) / grid.width / 2), 1, maxWidth);
  const brightness = normalizeBrightness(options.brightness);
  const contrast = normalizeContrast(options.contrast);
  const isBraille = options.ramp === "braille";
  const rampKey = isBraille ? null : (options.ramp as Exclude<RampId, "braille">);
  const cellWidth = isBraille ? 2 : 1;
  const cellHeight = isBraille ? 4 : 2;
  const sampleWidth = cols * cellWidth;
  const sampleHeight = rows * cellHeight;
  const samples = new Float64Array(sampleWidth * sampleHeight);

  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const sample = sampleCell(
        grid,
        (x * grid.width) / sampleWidth,
        (y * grid.height) / sampleHeight,
        grid.width / sampleWidth,
        grid.height / sampleHeight
      );
      samples[y * sampleWidth + x] = adjust(sample.luminance, brightness, contrast, options.invert);
    }
  }

  if (options.dither === "floyd-steinberg") {
    dither(samples, sampleWidth, sampleHeight, rampKey ? ramps[rampKey].length : 2);
  }

  const ramp = rampKey ? ramps[rampKey] : "";
  const lines: string[] = [];
  const colors: string[][] = [];

  for (let y = 0; y < rows; y += 1) {
    const chars: string[] = [];
    const rowColors: string[] = [];

    for (let x = 0; x < cols; x += 1) {
      const cell = sampleCell(
        grid,
        (x * grid.width) / cols,
        (y * grid.height) / rows,
        grid.width / cols,
        grid.height / rows
      );

      if (isBraille) {
        let bits = 0;
        brailleDots.forEach(([dx, dy], index) => {
          const sampleY = y * 4 + dy;
          const sampleX = x * 2 + dx;
          if ((samples[sampleY * sampleWidth + sampleX] ?? 0) >= 128) bits |= 1 << index;
        });
        chars.push(bits === 0 ? " " : String.fromCharCode(0x2800 + bits));
      } else {
        const index = Math.round(((samples[y * sampleWidth + x] ?? 0) / 255) * (ramp.length - 1));
        chars.push(ramp[clamp(index, 0, ramp.length - 1)] ?? " ");
      }

      rowColors.push(cellColor(cell.red, cell.green, cell.blue));
    }

    const line = chars.join("").replace(/[\s\u2800]+$/, "");
    lines.push(line);
    colors.push(rowColors.slice(0, line.length));
  }

  return {
    lines,
    width: Math.max(0, ...lines.map((line) => line.length)),
    colors,
    rows,
    cellWidth,
    cellHeight,
    hasUnsupported: false,
    unsupported: [],
  };
}
