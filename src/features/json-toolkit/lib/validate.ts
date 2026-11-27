export type SyntaxIssue = {
  line: number;
  column: number;
  position: number;
  message: string;
};

/**
 * SyntaxError wording differs across engines. Prefer an explicit line/column,
 * then fall back to a bare character position, then to the raw message.
 */
export function locateSyntaxError(text: string, error: unknown): SyntaxIssue {
  const message = error instanceof Error ? error.message : String(error);
  const lineColumn = /line (\d+) column (\d+)/i.exec(message);
  const barePosition = /position (\d+)/i.exec(message);

  if (lineColumn) {
    return {
      line: Number(lineColumn[1]),
      column: Number(lineColumn[2]),
      position: barePosition ? Number(barePosition[1]) : -1,
      message,
    };
  }

  if (barePosition) {
    const position = Number(barePosition[1]);
    const lines = text.slice(0, position).split("\n");
    const last = lines[lines.length - 1] ?? "";
    return {
      line: lines.length,
      column: last.length + 1,
      position,
      message,
    };
  }

  return { line: 0, column: 0, position: -1, message };
}
