"use client";

import { useState } from "react";
import { DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { formatBytes } from "@/features/image-studio/lib/output";
import { savingsPercent } from "@/features/image-studio/lib/resize";
import type { ImageJob } from "@/features/image-studio/lib/types";

/** Faint checkerboard so transparent output stays visible against the panel. */
const checkerboard = {
  backgroundImage:
    "linear-gradient(45deg, rgba(127,127,127,0.14) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.14) 75%), linear-gradient(45deg, rgba(127,127,127,0.14) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.14) 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 8px 8px",
};

type Labels = {
  preview: string;
  previewEmpty: string;
  livePreview: string;
  original: string;
  result: string;
  saved: string;
  download: string;
  status: Record<ImageJob["status"], string>;
};

export function PreviewPanel({
  job,
  labels,
  pending,
  onDownload,
}: {
  job?: ImageJob;
  labels: Labels;
  pending: boolean;
  onDownload: (job: ImageJob) => void;
}) {
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const result = job?.result;
  const source = result?.url ?? job?.previewUrl;
  const saved = result && job ? savingsPercent(job.size, result.blob.size) : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="shrink-0 text-xs font-semibold tracking-tight text-primary">{labels.preview}</h2>
          {result ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {labels.livePreview}
            </span>
          ) : null}
          <span className="truncate text-[11px] text-muted-foreground" title={job?.name}>
            {job?.name ?? ""}
          </span>
        </div>
        <button
          type="button"
          aria-label={labels.download}
          title={labels.download}
          data-testid="image-preview-download"
          disabled={!result}
          onClick={() => job && onDownload(job)}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primary hover:text-primary-foreground active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          <DownloadIcon className="size-3.5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-3">
        {/* Hidden probe: the visible image may be the converted result, but the
            "original" column must always report the source dimensions. */}
        {job ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={job.previewUrl}
            alt=""
            aria-hidden
            className="hidden"
            onLoad={(event) =>
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        ) : null}
        {source ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            data-testid="image-preview"
            src={source}
            alt={job?.name ?? ""}
            /* Checkerboard sits on the image itself, so only transparent pixels reveal it. */
            style={checkerboard}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <ImageIcon className="size-6" />
            <p className="max-w-[18rem] text-xs leading-5">{labels.previewEmpty}</p>
          </div>
        )}

        {pending ? (
          <span
            role="status"
            className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur"
          >
            <Loader2Icon className="size-3 animate-spin" />
            {labels.status.converting}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 text-[11px]">
        <div className="min-w-0 px-3 py-2">
          <p className="text-muted-foreground">{labels.original}</p>
          <p className="truncate font-medium">
            {natural ? `${natural.width}×${natural.height}` : "—"}
            {job ? ` · ${formatBytes(job.size)}` : ""}
          </p>
        </div>
        <div className="min-w-0 px-3 py-2">
          <p className="text-muted-foreground">{labels.result}</p>
          <p className="truncate font-medium">
            {result ? (
              <>
                {`${result.width}×${result.height} · ${formatBytes(result.blob.size)}`}
                {saved > 0 ? (
                  <span className="text-primary">{` · ${labels.saved} ${saved}%`}</span>
                ) : null}
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
