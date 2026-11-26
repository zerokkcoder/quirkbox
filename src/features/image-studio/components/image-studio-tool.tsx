"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArchiveIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { AddTile, UploadPanel, imageFiles } from "@/features/image-studio/components/drop-zone";
import { FormatPicker } from "@/features/image-studio/components/format-picker";
import { JobCard } from "@/features/image-studio/components/job-card";
import { PreviewPanel } from "@/features/image-studio/components/preview-panel";
import { decodeImage } from "@/features/image-studio/lib/decode";
import { encodeImage } from "@/features/image-studio/lib/encode";
import {
  detectAvailableFormats,
  detectSourceFormat,
  suggestFormat,
} from "@/features/image-studio/lib/formats";
import { downloadBlob, outputFilename } from "@/features/image-studio/lib/output";
import {
  needsBackground,
  normalizeBackground,
  normalizeQuality,
  stateToParams,
  supportsQuality,
} from "@/features/image-studio/lib/settings";
import { createZip } from "@/features/image-studio/lib/zip";
import {
  defaultFormat,
  type FormatId,
  type ImageJob,
  type ImageStudioState,
  type SourceFormatId,
} from "@/features/image-studio/lib/types";
import { trackEvent } from "@/lib/analytics";
import { getMessages, type Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";
import { localizePath } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site";

const baselineFormats: FormatId[] = ["png", "jpeg", "webp", "gif", "bmp", "ico"];

/** Debounce for the live preview so dragging a slider does not encode on every tick. */
const previewDelay = 350;

export function ImageStudioTool({
  locale,
  labels,
  initialState,
  syncUrl: shouldSyncUrl = true,
}: {
  locale: Locale;
  labels: Messages["imageStudio"];
  initialState: ImageStudioState;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialState);
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [available, setAvailable] = useState<FormatId[]>(baselineFormats);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [dragging, setDragging] = useState(false);
  const urlsRef = useRef(new Set<string>());
  const recordsRef = useRef(new Map<string, { file: File; sourceFormat: SourceFormatId | null }>());
  const previewGenRef = useRef(0);
  const stateRef = useRef(state);
  const jobsRef = useRef(jobs);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFilesRef = useRef<(files: File[]) => void>(() => {});

  // The live-preview effect keys off `settingsKey` only, so it reads the newest
  // settings through a ref instead of listing `state` as a dependency.
  stateRef.current = state;
  jobsRef.current = jobs;
  // `addFiles` closes over the current settings; the paste listener reads it via ref.
  addFilesRef.current = addFiles;

  const settingsKey = `${state.format}|${state.quality}|${state.width}|${state.height}|${state.background}`;

  const sizeLabel =
    state.width && state.height
      ? `≤ ${state.width}×${state.height}px`
      : state.width
        ? `≤ ${state.width}px`
        : state.height
          ? `≤ ${state.height}px`
          : labels.originalSize;
  const summaryText = supportsQuality(state.format)
    ? `${labels.formatNames[state.format]} · Q${state.quality} · ${sizeLabel}`
    : `${labels.formatNames[state.format]} · ${sizeLabel}`;

  const shareParams = new URLSearchParams();
  for (const [key, value] of Object.entries(stateToParams(state))) {
    if (value !== undefined) shareParams.set(key, value);
  }
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/image-converter")}?${shareParams.toString()}`;

  useEffect(() => {
    let cancelled = false;
    void detectAvailableFormats().then((formats) => {
      if (!cancelled) setAvailable(formats);
    });

    const urls = urlsRef.current;
    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = imageFiles(event.clipboardData?.files);
      if (!files.length) return;
      event.preventDefault();
      addFilesRef.current(files);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Live preview: encode only the selected image whenever the output settings change.
  useEffect(() => {
    if (!selectedId) return;
    const record = recordsRef.current.get(selectedId);
    if (!record) return;

    const jobId = selectedId;
    // Results are dropped as soon as the settings change, so an existing result
    // is always current: re-selecting an image must reuse it instead of paying
    // for another encode.
    if (jobsRef.current.find((job) => job.id === jobId)?.result) return;

    const gen = ++previewGenRef.current;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      setPreviewing(true);
      void (async () => {
        try {
          const decoded = await decodeImage(record.file, record.sourceFormat);
          if (cancelled || previewGenRef.current !== gen) return;
          const converted = await encodeImage(decoded, stateRef.current);
          if (cancelled || previewGenRef.current !== gen) return;

          const url = trackUrl(URL.createObjectURL(converted.blob));
          // The job owns this URL. Only ever release the URL of the very job
          // being replaced: revoking a neighbour's result leaves its <img> broken
          // when the user clicks back to it.
          const previousUrl = jobsRef.current.find((job) => job.id === jobId)?.result?.url;

          setJobs((previous) =>
            previous.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: "done" as const,
                    error: undefined,
                    result: {
                      blob: converted.blob,
                      url,
                      width: converted.width,
                      height: converted.height,
                      filename: outputFilename(
                        record.file.name,
                        stateRef.current.format,
                        stateRef.current.suffix
                      ),
                    },
                  }
                : job
            )
          );

          if (previousUrl && previousUrl !== url) releaseUrl(previousUrl);
        } catch {
          if (cancelled || previewGenRef.current !== gen) return;
          setJobs((previous) =>
            previous.map((job) =>
              job.id === jobId ? { ...job, status: "error" as const, error: labels.status.error } : job
            )
          );
        } finally {
          if (previewGenRef.current === gen) setPreviewing(false);
        }
      })();
    }, previewDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `labels.status.error` is stable message text; the effect must not re-run on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, settingsKey]);

  function showFeedback(message: string) {
    setFeedback(message);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFeedback(""), 4000);
  }

  function trackUrl(url: string) {
    urlsRef.current.add(url);
    return url;
  }

  function releaseUrl(url: string | undefined) {
    if (!url) return;
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  }

  /** Settings changed: every existing result is stale, so drop them before re-previewing. */
  function invalidateResults() {
    const stale: string[] = [];
    let changed = false;
    const next = jobs.map((job) => {
      if (!job.result && job.status !== "error") return job;
      changed = true;
      if (job.result) stale.push(job.result.url);
      return { ...job, result: undefined, status: "queued" as const, error: undefined };
    });
    if (!changed) return;
    stale.forEach(releaseUrl);
    setJobs(next);
  }

  function syncUrlFor(next: ImageStudioState) {
    if (!shouldSyncUrl) return;
    // `replaceState` notifies the Next.js Router, so it must stay outside the
    // setState updater: React runs updaters during the render phase, and
    // updating another component there is illegal (and fires twice in Strict Mode).
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), stateToParams(next));
  }

  function updateState(next: Partial<ImageStudioState>) {
    const nextState = { ...state, ...next };
    setState(nextState);
    invalidateResults();
    syncUrlFor(nextState);
  }

  function patchJob(id: string, patch: Partial<ImageJob>) {
    setJobs((previous) => previous.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  function removeJob(job: ImageJob) {
    releaseUrl(job.previewUrl);
    releaseUrl(job.result?.url);
    recordsRef.current.delete(job.id);
    const remaining = jobs.filter((item) => item.id !== job.id);
    setJobs(remaining);
    if (selectedId === job.id) {
      previewGenRef.current += 1;
      setPreviewing(false);
      setSelectedId(remaining[0]?.id ?? null);
    }
  }

  function clearJobs() {
    jobs.forEach((job) => {
      releaseUrl(job.previewUrl);
      releaseUrl(job.result?.url);
    });
    recordsRef.current.clear();
    previewGenRef.current += 1;
    setPreviewing(false);
    setJobs([]);
    setSelectedId(null);
    showFeedback(labels.feedback.cleared);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const added: ImageJob[] = files.map((file, index) => {
      const sourceFormat = detectSourceFormat(file);
      const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
      recordsRef.current.set(id, { file, sourceFormat });
      return {
        id,
        name: file.name,
        size: file.size,
        sourceFormat,
        previewUrl: trackUrl(URL.createObjectURL(file)),
        status: "queued",
      };
    });
    setJobs((previous) => [...previous, ...added]);
    setSelectedId((previous) => previous ?? added[0].id);

    // Pick a sensible target format once, without routing through `updateState`
    // (which would invalidate the queue built in this same render pass).
    if (state.format === defaultFormat) {
      const suggestion = suggestFormat(added[0].sourceFormat);
      if (suggestion !== state.format) {
        const nextState = { ...state, format: suggestion };
        setState(nextState);
        syncUrlFor(nextState);
      }
    }

    showFeedback(labels.feedback.added);
    trackEvent({ name: "image_files_added", metadata: { count: added.length } });
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = imageFiles(event.target.files);
    if (files.length) addFiles(files);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = imageFiles(event.dataTransfer.files);
    if (files.length) addFiles(files);
  }

  async function convertAll() {
    if (busy || jobs.length === 0) return;
    // Cancel any in-flight preview so a late single-image result cannot overwrite
    // the batch output written below.
    previewGenRef.current += 1;
    setPreviewing(false);
    setBusy(true);
    let failed = false;

    const snapshot = jobs.map((job) => ({
      id: job.id,
      record: recordsRef.current.get(job.id),
      previousResultUrl: job.result?.url,
    }));

    for (const item of snapshot) {
      if (!item.record) continue;
      patchJob(item.id, { status: "decoding", error: undefined });
      try {
        const decoded = await decodeImage(item.record.file, item.record.sourceFormat);
        patchJob(item.id, { status: "converting" });
        const converted = await encodeImage(decoded, state);
        const resultUrl = trackUrl(URL.createObjectURL(converted.blob));
        releaseUrl(item.previousResultUrl);

        patchJob(item.id, {
          status: "done",
          result: {
            blob: converted.blob,
            url: resultUrl,
            width: converted.width,
            height: converted.height,
            filename: outputFilename(item.record.file.name, state.format, state.suffix),
          },
        });
      } catch (error) {
        failed = true;
        patchJob(item.id, {
          status: "error",
          error: error instanceof Error ? error.message : labels.status.error,
        });
      }

      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    setBusy(false);
    showFeedback(failed ? labels.feedback.failed : labels.feedback.converted);
    trackEvent({ name: "image_batch_converted", metadata: { count: snapshot.length, format: state.format } });
  }

  function download(job: ImageJob) {
    if (!job.result) return;
    downloadBlob(job.result.blob, job.result.filename);
    showFeedback(labels.feedback.downloaded);
    trackEvent({ name: "image_downloaded", metadata: { format: state.format } });
  }

  async function downloadAll() {
    const results = jobs.filter((job) => job.result);
    if (!results.length) {
      showFeedback(labels.feedback.zipEmpty);
      return;
    }

    const seen = new Map<string, number>();
    const entries = await Promise.all(
      results.map(async (job) => {
        const original = job.result!.filename;
        const count = seen.get(original) ?? 0;
        seen.set(original, count + 1);
        const name = count ? original.replace(/(\.[^.]+)$/, `-${count + 1}$1`) : original;
        return { name, data: new Uint8Array(await job.result!.blob.arrayBuffer()) };
      })
    );

    const zip = createZip(entries);
    downloadBlob(
      new Blob([zip as BlobPart], { type: "application/zip" }),
      `starrudder-images-${results.length}.zip`
    );
    showFeedback(labels.feedback.downloadedAll);
    trackEvent({ name: "image_zip_downloaded", metadata: { count: results.length } });
  }

  const doneCount = jobs.filter((job) => job.result).length;
  const selectedJob = jobs.find((job) => job.id === selectedId);
  const rangeAllowed = supportsQuality(state.format);
  const backgroundAllowed = needsBackground(state.format);

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        multiple
        data-testid="image-file-input"
        className="sr-only"
        onChange={handleInputChange}
      />

      {/* Upload and preview sit side by side, both above the settings. */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`grid gap-4 lg:grid-cols-2 ${
          dragging && jobs.length ? "rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        }`}
      >
        <section
          aria-labelledby="image-upload-heading"
          className="flex h-[300px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 lg:h-[420px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
            <h2 id="image-upload-heading" className="text-xs font-semibold tracking-tight text-primary">
              {labels.uploadTitle}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {jobs.length ? `${doneCount} / ${jobs.length}` : ""}
            </span>
          </div>
          <div className="min-h-0 flex-1 p-2.5">
            {jobs.length ? (
              <ul
                data-testid="image-jobs"
                className="scrollbar-slim grid h-full auto-rows-min grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-gutter:stable] sm:grid-cols-3"
              >
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    labels={labels}
                    selected={job.id === selectedId}
                    onSelect={(item) => setSelectedId(item.id)}
                    onDownload={download}
                    onRemove={removeJob}
                  />
                ))}
                <AddTile labels={labels} dragging={dragging} onBrowse={openPicker} />
              </ul>
            ) : (
              <UploadPanel labels={labels} dragging={dragging} onBrowse={openPicker} />
            )}
          </div>
        </section>

        <div className="h-[300px] lg:h-[420px]">
          <PreviewPanel
            key={selectedId ?? "empty"}
            job={selectedJob}
            labels={labels}
            pending={previewing}
            onDownload={download}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button data-testid="image-convert-all" disabled={busy || jobs.length === 0} onClick={() => void convertAll()}>
          {busy ? labels.status.converting : labels.convertAll}
        </Button>
        <Button
          variant="outline"
          data-testid="image-download-all"
          disabled={doneCount === 0}
          onClick={() => void downloadAll()}
        >
          <ArchiveIcon data-icon="inline-start" />
          {labels.downloadAll}
        </Button>
        <Button variant="ghost" data-testid="image-clear" disabled={!jobs.length} onClick={clearJobs}>
          {labels.clear}
        </Button>
        <div className="ml-auto">
          <ShareToXButton
            labels={getMessages(locale).share}
            tool="image-converter"
            title={labels.title}
            description={labels.description}
            url={shareUrl}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/40 px-4 py-3">
        <FormatPicker
          labels={labels}
          available={available}
          value={state.format}
          onChange={(format) => updateState({ format })}
        />
        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{labels.formatsHint}</p>
      </div>

      <details className="group rounded-2xl border border-border/70 bg-card/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span>{labels.advancedTitle}</span>
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            {summaryText}
            <ChevronDownIcon className="size-4 transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-180" />
          </span>
        </summary>
        <div className="grid gap-4 border-t border-border/70 px-4 py-4 sm:grid-cols-2">
          <Field className={`sm:col-span-2 ${rangeAllowed ? "" : "opacity-50"}`}>
            <FieldLabel htmlFor="image-quality">{labels.quality}</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                id="image-quality"
                data-testid="image-quality"
                type="range"
                min={1}
                max={100}
                value={state.quality}
                disabled={!rangeAllowed}
                onChange={(event) => updateState({ quality: normalizeQuality(event.target.value) })}
                className="w-full accent-primary"
              />
              <span className="w-8 text-center font-mono text-sm">{state.quality}</span>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="image-width">{labels.maxWidth}</FieldLabel>
            <Input
              id="image-width"
              data-testid="image-width"
              type="number"
              min={0}
              max={8192}
              value={state.width || ""}
              placeholder={labels.auto}
              onChange={(event) => updateState({ width: Number(event.target.value) || 0 })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="image-height">{labels.maxHeight}</FieldLabel>
            <Input
              id="image-height"
              data-testid="image-height"
              type="number"
              min={0}
              max={8192}
              value={state.height || ""}
              placeholder={labels.auto}
              onChange={(event) => updateState({ height: Number(event.target.value) || 0 })}
            />
          </Field>

          <Field className={`sm:col-span-2 ${backgroundAllowed ? "" : "opacity-50"}`}>
            <FieldLabel htmlFor="image-background">{labels.background}</FieldLabel>
            <div className="flex gap-2">
              <input
                id="image-background"
                data-testid="image-background"
                type="color"
                value={`#${state.background}`}
                disabled={!backgroundAllowed}
                onChange={(event) => updateState({ background: normalizeBackground(event.target.value) })}
                className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
              />
              <Input
                aria-label={labels.background}
                value={`#${state.background}`}
                disabled={!backgroundAllowed}
                onChange={(event) => updateState({ background: normalizeBackground(event.target.value) })}
              />
            </div>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>{labels.suffix}</FieldLabel>
            <ToggleGroup
              variant="outline"
              value={[state.suffix ? "on" : "off"]}
              onValueChange={(value) => {
                if (value[0]) updateState({ suffix: value[0] === "on" });
              }}
            >
              <ToggleGroupItem value="on" data-testid="image-suffix-on">ON</ToggleGroupItem>
              <ToggleGroupItem value="off" data-testid="image-suffix-off">OFF</ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>{labels.suffixHint}</FieldDescription>
          </Field>
        </div>
      </details>

      <p className="text-xs leading-5 text-muted-foreground">{labels.privacyNote}</p>

      <span role="status" data-testid="image-feedback" className="text-xs text-muted-foreground">
        {feedback}
      </span>
    </div>
  );
}
