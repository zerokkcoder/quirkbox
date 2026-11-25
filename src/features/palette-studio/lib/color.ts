import { defaultSeedColor } from "./types";

export type Rgb = { r: number; g: number; b: number };
export type Oklch = { l: number; c: number; h: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Returns a lowercase six-digit hex without `#`; invalid input falls back. */
export function normalizeHex(input: string | undefined | null, fallback = defaultSeedColor) {
  const raw = (input ?? "").trim().replace(/^#/, "");
  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return fallback.replace(/^#/, "").toLowerCase();
  }

  return expanded.toLowerCase();
}

export function withHash(hex: string) {
  return `#${normalizeHex(hex)}`;
}

export function hexToRgb(hex: string): Rgb {
  const value = normalizeHex(hex);

  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}

export function rgbToHex({ r, g, b }: Rgb) {
  const channel = (value: number) =>
    Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");

  return `${channel(r)}${channel(g)}${channel(b)}`;
}

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const toGamma = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

export function rgbToOklch(rgb: Rgb): Oklch {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const beta = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const chroma = Math.hypot(a, beta);
  const hue = (Math.atan2(beta, a) * 180) / Math.PI;

  return {
    l: clamp(lightness, 0, 1),
    c: chroma,
    h: hue < 0 ? hue + 360 : hue,
  };
}

function oklabToLinearRgb(lightness: number, a: number, beta: number): Rgb {
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * beta;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * beta;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * beta;

  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

const inGamut = ({ r, g, b }: Rgb) =>
  r >= -0.0001 && r <= 1.0001 && g >= -0.0001 && g <= 1.0001 && b >= -0.0001 && b <= 1.0001;

/** Chroma is reduced by bisection until the colour fits inside sRGB. */
export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const beta = c * Math.sin(radians);

  let low = Math.max(0, c);
  let high = Math.max(0, c);

  if (!inGamut(oklabToLinearRgb(l, a, beta))) {
    low = 0;

    for (let index = 0; index < 24; index += 1) {
      const middle = (low + high) / 2;
      if (inGamut(oklabToLinearRgb(l, middle * Math.cos(radians), middle * Math.sin(radians)))) {
        low = middle;
      } else {
        high = middle;
      }
    }
  }

  const linear = oklabToLinearRgb(l, low * Math.cos(radians), low * Math.sin(radians));

  return {
    r: clamp(toGamma(linear.r), 0, 1),
    g: clamp(toGamma(linear.g), 0, 1),
    b: clamp(toGamma(linear.b), 0, 1),
  };
}

export function oklchToHex(oklch: Oklch) {
  return rgbToHex(oklchToRgb(oklch));
}

export function normalizeHue(hue: number) {
  return ((hue % 360) + 360) % 360;
}
