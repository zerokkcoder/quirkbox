import { parseTravelFootprintState } from "./storage";
import type { TravelFootprintState } from "./types";

export const travelFootprintFileVersion = 1;
export const travelFootprintDataFilename = "quirkbox-travel-footprint.json";

export type TravelFootprintFile = {
  app: "quirkbox";
  tool: "travel-footprint";
  version: number;
  exportedAt: string;
  state: TravelFootprintState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeTravelFootprintState(state: TravelFootprintState, exportedAt: string): string {
  const payload: TravelFootprintFile = {
    app: "quirkbox",
    tool: "travel-footprint",
    version: travelFootprintFileVersion,
    exportedAt,
    state,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * Reads a JSON export. Accepts both the versioned envelope and a bare state
 * object (useful for hand-written files), but rejects anything that doesn't
 * at least look like footprint data — importing an empty state by accident
 * would silently wipe the user's current map.
 */
export function parseTravelFootprintFile(text: string): TravelFootprintState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;

  const candidate =
    parsed.app === "quirkbox" && parsed.tool === "travel-footprint" && isRecord(parsed.state)
      ? parsed.state
      : parsed;

  if (!isRecord(candidate) || !Array.isArray(candidate.spots) || candidate.spots.length > 1000) {
    return null;
  }

  return parseTravelFootprintState(candidate);
}

/** Triggers a browser download of a small UTF-8 text file. */
export function downloadTextFile(text: string, filename: string, mime = "application/json"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTravelFootprintData(state: TravelFootprintState): void {
  downloadTextFile(
    serializeTravelFootprintState(state, new Date().toISOString()),
    travelFootprintDataFilename,
  );
}
