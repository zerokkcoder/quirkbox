export const errorLevels = ["L", "M", "Q", "H"] as const;
export type ErrorLevel = (typeof errorLevels)[number];

export const dotStyles = ["square", "dots", "rounded"] as const;
export type DotStyle = (typeof dotStyles)[number];

export const exportSizes = [256, 512, 1024] as const;
export type ExportSize = (typeof exportSizes)[number];

/** QR byte-mode capacity at version 40 (the largest symbol), by error level. */
export const maxBytesByLevel: Record<ErrorLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export const defaultText = "https://starrudder.cc";
export const defaultLevel: ErrorLevel = "M";
export const defaultSize: ExportSize = 512;
export const defaultForeground = "10182c";
export const defaultBackground = "ffffff";
export const defaultDotStyle: DotStyle = "square";
export const defaultTransparent = false;

/** Fixed 4-module quiet zone — closing it breaks scan reliability. */
export const quietZone = 4;

/** A center logo may cover at most 1/5 of the code width. */
export const maxLogoRatio = 0.2;

/** WCAG contrast below this is a warning for a graphic that must be read by a scanner. */
export const minContrastRatio = 3;

export type QrState = {
  text: string;
  level: ErrorLevel;
  size: ExportSize;
  foreground: string;
  background: string;
  dots: DotStyle;
  transparent: boolean;
};

export type QrMatrix = {
  count: number;
  /** `cells[row][col]` is true for a dark module. */
  cells: boolean[][];
};

export type LogoData = {
  /** Data URL for the uploaded image. Never serialized into the share URL. */
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
};
