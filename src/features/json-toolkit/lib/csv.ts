import { delimiterChar, type DelimiterId } from "./types";

export type ConversionResult = { ok: true; text: string } | { ok: false; message: string };

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function encodeCell(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(",") ||
    value.includes("\t") ||
    value.includes(delimiter);
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

export function jsonToDelimited(jsonText: string, delimiterId: DelimiterId): ConversionResult {
  let value: unknown;
  try {
    value = JSON.parse(jsonText.replace(/^\uFEFF/, ""));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }

  const rows = Array.isArray(value) ? value : value !== null && typeof value === "object" ? [value] : null;
  if (
    !rows ||
    rows.some((row) => row === null || typeof row !== "object" || Array.isArray(row))
  ) {
    return { ok: false, message: "Input must be an object or an array of objects." };
  }

  const delimiter = delimiterChar(delimiterId);
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row as Record<string, unknown>)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }

  const lines = [headers.map((header) => encodeCell(header, delimiter)).join(delimiter)];
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    lines.push(headers.map((header) => encodeCell(cellValue(record[header]), delimiter)).join(delimiter));
  }

  return { ok: true, text: lines.join("\n") };
}

/** RFC 4180-style scanner: quoted cells, doubled quotes and embedded newlines. */
function parseRows(text: string, delimiter: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (inQuotes) {
      if (char === '"' && normalized[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function delimitedToJson(text: string, delimiterId: DelimiterId): ConversionResult {
  const rows = parseRows(text, delimiterChar(delimiterId));
  if (rows.length === 0) return { ok: true, text: "[]" };

  const [headers, ...dataRows] = rows;
  const objects = dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });

  return { ok: true, text: JSON.stringify(objects, null, 2) };
}
