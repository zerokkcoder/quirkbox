import { hexToRgb, type Rgb } from "./color";

const relativeLuminance = ({ r, g, b }: Rgb) => {
  const linear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export function contrastRatio(first: Rgb, second: Rgb) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function contrastOnWhite(hex: string) {
  return contrastRatio(hexToRgb(hex), { r: 1, g: 1, b: 1 });
}

export function contrastOnBlack(hex: string) {
  return contrastRatio(hexToRgb(hex), { r: 0, g: 0, b: 0 });
}

export function bestForeground(hex: string): "#ffffff" | "#000000" {
  return contrastOnWhite(hex) >= contrastOnBlack(hex) ? "#ffffff" : "#000000";
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";

  return "Fail";
}
