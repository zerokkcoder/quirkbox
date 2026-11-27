import { defaultIndent, indentUnit, type IndentId } from "./types";
import { locateSyntaxError, type SyntaxIssue } from "./validate";

export type FormatOptions = {
  indent?: IndentId;
  sortKeys?: boolean;
  minify?: boolean;
};

export type FormatResult =
  | { ok: true; text: string; charCount: number }
  | { ok: false; issue: SyntaxIssue };

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }
  return value;
}

export function formatJson(input: string, options: FormatOptions = {}): FormatResult {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch (error) {
    return { ok: false, issue: locateSyntaxError(input, error) };
  }

  const prepared = options.sortKeys ? sortValue(value) : value;
  const text = JSON.stringify(
    prepared,
    null,
    options.minify ? undefined : indentUnit(options.indent ?? defaultIndent)
  );

  return { ok: true, text, charCount: text.length };
}
