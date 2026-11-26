export const gradientTypeIds = ["linear", "radial", "conic"] as const;
export type GradientTypeId = (typeof gradientTypeIds)[number];
export const defaultGradientType: GradientTypeId = "linear";

export function normalizeGradientType(value?: string | null): GradientTypeId {
  return (gradientTypeIds as readonly string[]).includes(value ?? "")
    ? (value as GradientTypeId)
    : defaultGradientType;
}

export const gradientRatioIds = ["9:16", "9:19.5", "9:20", "16:9", "16:10", "4:3"] as const;
export type GradientRatioId = (typeof gradientRatioIds)[number];
export const defaultGradientRatio: GradientRatioId = "9:16";

export function normalizeGradientRatio(value?: string | null): GradientRatioId {
  return (gradientRatioIds as readonly string[]).includes(value ?? "")
    ? (value as GradientRatioId)
    : defaultGradientRatio;
}

export const centerPresets = [
  { id: "top-left", x: 0, y: 0 },
  { id: "top", x: 50, y: 0 },
  { id: "top-right", x: 100, y: 0 },
  { id: "left", x: 0, y: 50 },
  { id: "center", x: 50, y: 50 },
  { id: "right", x: 100, y: 50 },
  { id: "bottom-left", x: 0, y: 100 },
  { id: "bottom", x: 50, y: 100 },
  { id: "bottom-right", x: 100, y: 100 },
] as const;

export type CenterPresetId = (typeof centerPresets)[number]["id"];
export const defaultCenterPreset: CenterPresetId = "center";

export function normalizeCenterPreset(value?: string | null): CenterPresetId {
  return (centerPresets as readonly { id: string }[]).some((preset) => preset.id === value)
    ? (value as CenterPresetId)
    : defaultCenterPreset;
}

export function getCenterPoint(center: CenterPresetId): { x: number; y: number } {
  const preset = centerPresets.find((item) => item.id === center) ?? centerPresets[4];
  return { x: preset.x, y: preset.y };
}

export const minColorStops = 2;
export const maxColorStops = 5;
export const defaultAngle = 135;

export type ColorStop = {
  /** Stable React key; regenerated on shuffle, derived from index on URL parse. */
  id: string;
  /** Six-digit hex without the leading `#`. */
  color: string;
  /** Percentage along the gradient, 0–100. */
  position: number;
};

export type GradientState = {
  seed: string;
  stops: ColorStop[];
  type: GradientTypeId;
  angle: number;
  center: CenterPresetId;
  ratio: GradientRatioId;
  showText: boolean;
};
