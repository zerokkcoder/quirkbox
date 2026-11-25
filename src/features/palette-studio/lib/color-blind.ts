import { hexToRgb, rgbToHex } from "./color";

export const simulationIds = ["none", "protanopia", "deuteranopia", "tritanopia"] as const;
export type SimulationId = (typeof simulationIds)[number];

/** Viénot/Brettel approximations applied in linear RGB space. */
const matrices: Record<Exclude<SimulationId, "none">, [number, number, number][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const toGamma = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function normalizeSimulation(input: string | undefined | null): SimulationId {
  return simulationIds.find((id) => id === input) ?? "none";
}

export function simulateColorblind(hex: string, type: SimulationId): string {
  if (type === "none") return hex;

  const rgb = hexToRgb(hex);
  const [r, g, b] = [toLinear(rgb.r), toLinear(rgb.g), toLinear(rgb.b)];
  const matrix = matrices[type];

  return rgbToHex({
    r: clamp(toGamma(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b)),
    g: clamp(toGamma(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b)),
    b: clamp(toGamma(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b)),
  });
}

export function simulatePalette(palette: string[], type: SimulationId) {
  return palette.map((hex) => simulateColorblind(hex, type));
}
