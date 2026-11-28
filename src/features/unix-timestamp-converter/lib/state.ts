import type { UnitChoice } from "./types";

/**
 * ADR-0002: the input lives in the URL FRAGMENT. Fragments are never sent in an
 * HTTP request, so a pasted log/JWT value never reaches the server, SSR
 * searchParams, or server logs, while the link stays shareable and refreshable.
 *
 * Only `v` (the input) is stored. A unit override and the chosen zone stay in
 * memory on purpose: a recipient should see the instant in THEIR local zone,
 * and the unit is re-detected from the value.
 */
const inputKey = "v";

export function encodeHash(input: string): string {
  const trimmed = input.trim();
  return trimmed ? `#${inputKey}=${encodeURIComponent(trimmed)}` : "";
}

export function decodeHash(hash: string): string {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) {
    return "";
  }
  try {
    return new URLSearchParams(raw).get(inputKey) ?? "";
  } catch {
    return "";
  }
}

export function readInputFromLocation(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return decodeHash(window.location.hash);
}

/** replaceState (not pushState): typing must not create a history entry per keystroke. */
export function writeInputToLocation(input: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = `${window.location.pathname}${window.location.search}${encodeHash(input)}`;
  window.history.replaceState(window.history.state, "", next);
}

/** Whitelist for analytics. The input value must never appear here. */
export function eventMetadata(unit: UnitChoice, zone: string) {
  return {
    tool: "unix-timestamp-converter",
    unit,
    zone,
  };
}
