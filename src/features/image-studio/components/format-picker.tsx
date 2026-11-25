"use client";

import { formatIds, type FormatId } from "@/features/image-studio/lib/types";

type Labels = {
  formatTitle: string;
  formatNames: Record<FormatId, string>;
  formatNotes: Record<string, string>;
  unavailable: string;
};

export function FormatPicker({
  labels,
  available,
  value,
  onChange,
}: {
  labels: Labels;
  available: FormatId[];
  value: FormatId;
  onChange: (format: FormatId) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {labels.formatTitle}
      </legend>
      <div className="flex flex-wrap gap-2">
        {formatIds.map((format) => {
          const enabled = available.includes(format);
          const active = value === format;

          return (
            <button
              key={format}
              type="button"
              data-testid={`image-format-${format}`}
              aria-pressed={active}
              disabled={!enabled}
              title={enabled ? labels.formatNotes[format] : labels.unavailable}
              onClick={() => onChange(format)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/60"
              }`}
            >
              {labels.formatNames[format]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{labels.formatNotes[value]}</p>
    </fieldset>
  );
}
