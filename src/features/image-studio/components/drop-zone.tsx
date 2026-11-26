"use client";

import { ImagePlusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Labels = {
  dropTitle: string;
  pasteHint: string;
  browse: string;
  addMore: string;
};

const imagePattern = /\.(png|jpe?g|webp|avif|gif|bmp|ico|svg)$/i;

/** Accept by MIME when the browser knows it, otherwise fall back to the extension. */
export function imageFiles(list: FileList | File[] | null | undefined): File[] {
  return list
    ? Array.from(list).filter(
        (file) => file.type.startsWith("image/") || imagePattern.test(file.name)
      )
    : [];
}

/** Empty state for the upload column: one large target that fills the whole half. */
export function UploadPanel({
  labels,
  dragging,
  onBrowse,
}: {
  labels: Labels;
  dragging: boolean;
  onBrowse: () => void;
}) {
  return (
    <div
      data-testid="image-drop-zone"
      className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-8 text-center transition-[border-color,background-color] duration-200 ease-[var(--ease-out)] ${
        dragging ? "border-primary bg-primary/10" : "border-border bg-background/40"
      }`}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ImagePlusIcon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{labels.dropTitle}</p>
        <p className="mx-auto max-w-[26rem] text-xs leading-5 text-muted-foreground">
          {labels.pasteHint}
        </p>
      </div>
      <Button type="button" data-testid="image-browse" onClick={onBrowse}>
        {labels.browse}
      </Button>
    </div>
  );
}

/** The square slot that closes the thumbnail grid, so adding more never needs a separate panel. */
export function AddTile({
  labels,
  dragging,
  onBrowse,
}: {
  labels: Labels;
  dragging: boolean;
  onBrowse: () => void;
}) {
  return (
    <li
      className={`rounded-xl border-2 border-dashed transition-[border-color,background-color] duration-200 ease-[var(--ease-out)] ${
        dragging ? "border-primary bg-primary/10 text-primary" : "border-border/70"
      }`}
    >
      {/* Mirrors JobCard: square image slot plus the same footer height, so the
          tile never sits shorter (or taller) than the image next to it. */}
      <button
        type="button"
        data-testid="image-add-more"
        onClick={onBrowse}
        className="flex size-full flex-col rounded-[inherit] text-[11px] font-medium text-muted-foreground transition-colors duration-150 ease-[var(--ease-out)] hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]"
      >
        <span className="flex aspect-square w-full items-center justify-center">
          <PlusIcon className="size-5" />
        </span>
        <span className="flex min-h-[4.25rem] w-full items-center justify-center px-2 whitespace-nowrap">
          {labels.addMore}
        </span>
      </button>
    </li>
  );
}
