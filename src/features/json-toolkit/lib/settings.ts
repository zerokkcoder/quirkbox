import {
  defaultDelimiter,
  defaultDirection,
  defaultIndent,
  defaultSortKeys,
  defaultTab,
  defaultToolkitState,
  normalizeBoolean,
  normalizeDelimiter,
  normalizeDirection,
  normalizeIndent,
  normalizeTab,
  type ToolkitState,
} from "./types";

export type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Only settings are serialised. Input JSON/CSV text is deliberately never
 * written to the URL — share links reproduce the setup, not the data.
 */
export function parseToolkitState(source: ParamSource): ToolkitState {
  return {
    tab: normalizeTab(readParam(source, "tab")),
    indent: normalizeIndent(readParam(source, "indent")),
    sortKeys: normalizeBoolean(readParam(source, "sort")),
    direction: normalizeDirection(readParam(source, "direction")),
    delimiter: normalizeDelimiter(readParam(source, "delimiter")),
  };
}

export function stateToParams(state: ToolkitState): Record<string, string | undefined> {
  return {
    tab: state.tab === defaultTab ? undefined : state.tab,
    indent: state.indent === defaultIndent ? undefined : state.indent,
    sort: state.sortKeys === defaultSortKeys ? undefined : "1",
    direction: state.direction === defaultDirection ? undefined : state.direction,
    delimiter: state.delimiter === defaultDelimiter ? undefined : state.delimiter,
  };
}

export function isDefaultState(state: ToolkitState): boolean {
  return Object.entries(defaultToolkitState).every(
    ([key, value]) => state[key as keyof ToolkitState] === value
  );
}
