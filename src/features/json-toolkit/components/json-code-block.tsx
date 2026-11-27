"use client";

import { Fragment, useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { indentUnit, type IndentId } from "../lib/types";

type CodeBlockLabels = {
  collapseNode: string;
  expandNode: string;
};

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

/**
 * Viewer-only JSON renderer. Collapsing a node changes what is drawn on screen;
 * the formatted source used by Copy/Share is never modified.
 */
export function JsonCodeBlock({
  value,
  indent,
  labels,
}: {
  value: unknown;
  indent: IndentId;
  labels: CodeBlockLabels;
}) {
  const [collapsedPaths, setCollapsedPaths] = useState<ReadonlySet<string>>(() => new Set());
  const unit = indentUnit(indent);
  const pad = typeof unit === "number" ? " ".repeat(unit) : unit;

  function toggle(path: string) {
    setCollapsedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function renderNode({
    value,
    path,
    depth,
    prefix = "",
    trailingComma,
  }: {
    value: unknown;
    path: string;
    depth: number;
    prefix?: string;
    trailingComma: boolean;
  }): ReactNode[] {
    const comma = trailingComma ? "," : "";
    const baseIndent = pad.repeat(depth);

    if (!isContainer(value)) {
      return [
        <Fragment key={path}>{`${baseIndent}${prefix}${JSON.stringify(value)}${comma}`}</Fragment>,
      ];
    }

    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value as Record<string, unknown>);
    const isCollapsed = collapsedPaths.has(path) || entries.length === 0;

    const caret = entries.length > 0 ? (
      <button
        type="button"
        aria-label={isCollapsed ? labels.expandNode : labels.collapseNode}
        aria-expanded={!isCollapsed}
        onClick={() => toggle(path)}
        className="inline-flex w-3.5 justify-center text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="size-3" />
        ) : (
          <ChevronDownIcon className="size-3" />
        )}
      </button>
    ) : (
      <span className="inline-block w-3.5" aria-hidden="true" />
    );

    if (isCollapsed) {
      return [
        <Fragment key={path}>
          {caret}
          {`${baseIndent}${prefix}${JSON.stringify(value)}${comma}`}
        </Fragment>,
      ];
    }

    const open = Array.isArray(value) ? "[" : "{";
    const close = Array.isArray(value) ? "]" : "}";
    const lines: ReactNode[] = [
      <Fragment key={`${path}-open`}>
        {caret}
        {`${baseIndent}${prefix}${open}`}
      </Fragment>,
    ];

    entries.forEach(([key, child], index) => {
      lines.push(
        ...renderNode({
          value: child,
          path: `${path}[${JSON.stringify(key)}]`,
          depth: depth + 1,
          prefix: Array.isArray(value) ? "" : `${JSON.stringify(key)}: `,
          trailingComma: index < entries.length - 1,
        })
      );
    });

    lines.push(
      <Fragment key={`${path}-close`}>
        <span className="inline-block w-3.5" aria-hidden="true" />
        {`${baseIndent}${close}${comma}`}
      </Fragment>
    );
    return lines;
  }

  const lines = renderNode({ value, path: "$", depth: 0, trailingComma: false });

  return (
    <pre
      id="json-output-region"
      data-testid="json-output"
      className="scrollbar-slim min-h-0 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6"
    >
      {lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? "\n" : null}
          {line}
        </Fragment>
      ))}
    </pre>
  );
}
