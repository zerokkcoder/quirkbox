export const tabIds = ["format", "convert"] as const;
export type ToolkitTab = (typeof tabIds)[number];
export const defaultTab: ToolkitTab = "format";

export const indentIds = ["2", "4", "tab"] as const;
export type IndentId = (typeof indentIds)[number];
export const defaultIndent: IndentId = "2";

export const directionIds = ["to-csv", "to-json"] as const;
export type Direction = (typeof directionIds)[number];
export const defaultDirection: Direction = "to-csv";

export const delimiterIds = ["csv", "tsv"] as const;
export type DelimiterId = (typeof delimiterIds)[number];
export const defaultDelimiter: DelimiterId = "csv";

export const defaultSortKeys = false;

export const defaultSampleJson = `{
  "name": "StarRudder",
  "browserOnly": true,
  "tools": ["JSON Toolkit", "ASCII Art"],
  "meta": { "uploads": 0, "offline": true }
}`;

export type ToolkitState = {
  tab: ToolkitTab;
  indent: IndentId;
  sortKeys: boolean;
  direction: Direction;
  delimiter: DelimiterId;
};

export const defaultToolkitState: ToolkitState = {
  tab: defaultTab,
  indent: defaultIndent,
  sortKeys: defaultSortKeys,
  direction: defaultDirection,
  delimiter: defaultDelimiter,
};

function isOneOf<T extends string>(ids: readonly T[], value?: string | null): value is T {
  return ids.includes((value ?? "") as T);
}

export function normalizeTab(value?: string | null): ToolkitTab {
  return isOneOf(tabIds, value) ? value : defaultTab;
}

export function normalizeIndent(value?: string | null): IndentId {
  return isOneOf(indentIds, value) ? value : defaultIndent;
}

export function normalizeDirection(value?: string | null): Direction {
  return isOneOf(directionIds, value) ? value : defaultDirection;
}

export function normalizeDelimiter(value?: string | null): DelimiterId {
  return isOneOf(delimiterIds, value) ? value : defaultDelimiter;
}

export function normalizeBoolean(value?: string | null): boolean {
  return value === "1" || value === "true";
}

/** Tab indentation is a literal tab; numeric options become a repeat count. */
export function indentUnit(indent: IndentId): string | number {
  return indent === "tab" ? "\t" : Number(indent);
}

export function delimiterChar(delimiter: DelimiterId): string {
  return delimiter === "tsv" ? "\t" : ",";
}
