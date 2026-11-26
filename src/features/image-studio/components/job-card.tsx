"use client";

import { DownloadIcon, Trash2Icon } from "lucide-react";
import { formatBytes } from "@/features/image-studio/lib/output";
import { savingsPercent } from "@/features/image-studio/lib/resize";
import type { ImageJob } from "@/features/image-studio/lib/types";

type Labels = {
  download: string;
  remove: string;
  preview: string;
  status: Record<ImageJob["status"], string>;
  saved: string;
};

export function JobCard({
  job,
  labels,
  selected,
  onSelect,
  onDownload,
  onRemove,
}: {
  job: ImageJob;
  labels: Labels;
  selected: boolean;
  onSelect: (job: ImageJob) => void;
  onDownload: (job: ImageJob) => void;
  onRemove: (job: ImageJob) => void;
}) {
  const saved = job.result ? savingsPercent(job.size, job.result.blob.size) : 0;
  const busy = job.status === "decoding" || job.status === "converting";

  return (
    <li
      data-testid="image-job"
      data-selected={selected ? "true" : undefined}
      className={`group relative overflow-hidden rounded-xl border bg-card/60 transition-colors duration-150 ease-[var(--ease-out)] ${
        selected ? "border-primary ring-1 ring-primary/40" : "border-border/70 hover:border-primary/50"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(job)}
        aria-pressed={selected}
        aria-label={`${labels.preview} ${job.name}`}
        className="block w-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative aspect-square bg-muted/30">
          {/* Always the source image: the preview column shows the converted result. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.previewUrl} alt="" className="size-full object-contain" />
          <span className="absolute top-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
            {labels.status[job.status]}
          </span>
          {busy ? <div className="absolute inset-0 animate-pulse bg-primary/5" /> : null}
        </div>
        {/* Fixed footer height keeps every card, and the "add more" tile, the
            same size no matter how many lines each image produces. */}
        <div className="flex min-h-[4.25rem] flex-col justify-center px-2.5 py-2">
          <p className="truncate text-xs font-medium" title={job.name}>
            {job.name}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {job.result ? `${formatBytes(job.size)} → ${formatBytes(job.result.blob.size)}` : formatBytes(job.size)}
          </p>
          {job.result ? (
            <p className="truncate text-[10px] font-medium text-primary">
              {saved > 0 ? `${labels.saved} ${saved}%` : `${job.result.width}×${job.result.height}`}
            </p>
          ) : job.error ? (
            <p className="truncate text-[10px] text-destructive" title={job.error}>
              {job.error}
            </p>
          ) : null}
        </div>
      </button>
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          aria-label={labels.download}
          title={labels.download}
          disabled={!job.result}
          onClick={() => onDownload(job)}
          className="flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primary hover:text-primary-foreground active:scale-90 disabled:opacity-40 disabled:hover:bg-background/90 disabled:hover:text-foreground"
        >
          <DownloadIcon className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={labels.remove}
          title={labels.remove}
          onClick={() => onRemove(job)}
          className="flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-destructive hover:text-destructive-foreground active:scale-90"
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
