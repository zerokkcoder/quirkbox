"use client";

import { useRef, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeHex, normalizePosition } from "@/features/gradient-wallpaper-generator/lib/settings";
import { maxColorStops, minColorStops, type ColorStop } from "@/features/gradient-wallpaper-generator/lib/types";

export type ColorStopTrackLabels = {
  color: string;
  position: string;
  add: string;
  remove: string;
  hint: string;
};

function trackBackground(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return `linear-gradient(90deg, ${sorted
    .map((stop) => `#${stop.color} ${stop.position}%`)
    .join(", ")})`;
}

export function ColorStopTrack({
  stops,
  onChange,
  labels,
}: {
  stops: ColorStop[];
  onChange: (stops: ColorStop[]) => void;
  labels: ColorStopTrackLabels;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const nextIdRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string>(stops[0]?.id ?? "");
  const selected = stops.find((stop) => stop.id === selectedId) ?? stops[0];

  function nextStopId(): string {
    nextIdRef.current += 1;
    return `custom-${nextIdRef.current}`;
  }

  function updateStop(id: string, patch: Partial<ColorStop>) {
    onChange(stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)));
  }

  function positionFromPointer(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return normalizePosition(((clientX - rect.left) / rect.width) * 100, 0);
  }

  function handleTrackClick(event: React.PointerEvent<HTMLDivElement>) {
    if (dragIdRef.current || stops.length >= maxColorStops) return;
    if ((event.target as HTMLElement).closest("[data-stop-handle]")) return;

    const position = positionFromPointer(event.clientX);
    const nearest = [...stops].sort(
      (a, b) => Math.abs(a.position - position) - Math.abs(b.position - position)
    )[0];
    const id = nextStopId();
    const next = [...stops, { id, color: nearest?.color ?? "3e5c9e", position }];
    setSelectedId(id);
    onChange(next);
  }

  function handleHandleDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIdRef.current = id;
    setSelectedId(id);
  }

  function handleHandleMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragIdRef.current) return;
    updateStop(dragIdRef.current, { position: positionFromPointer(event.clientX) });
  }

  function handleHandleUp() {
    dragIdRef.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, stop: ColorStop) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const delta = event.key === "ArrowLeft" ? -step : step;
      updateStop(stop.id, { position: normalizePosition(stop.position + delta, stop.position) });
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && stops.length > minColorStops) {
      event.preventDefault();
      const next = stops.filter((item) => item.id !== stop.id);
      setSelectedId(next[0]?.id ?? "");
      onChange(next);
    }
  }

  function removeSelected() {
    if (!selected || stops.length <= minColorStops) return;
    const next = stops.filter((stop) => stop.id !== selected.id);
    setSelectedId(next[0]?.id ?? "");
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        data-testid="gradient-stop-track"
        onPointerDown={handleTrackClick}
        role="group"
        aria-label={labels.color}
        className="relative h-12 cursor-crosshair rounded-xl border border-border/70"
        style={{ background: trackBackground(stops) }}
      >
        {stops.map((stop) => (
          <button
            key={stop.id}
            type="button"
            data-stop-handle
            data-testid={`gradient-stop-${stop.id}`}
            aria-label={`${labels.color} ${stop.position}%`}
            onPointerDown={(event) => handleHandleDown(event, stop.id)}
            onPointerMove={handleHandleMove}
            onPointerUp={handleHandleUp}
            onPointerCancel={handleHandleUp}
            onKeyDown={(event) => handleKeyDown(event, stop)}
            onClick={() => setSelectedId(stop.id)}
            className={cn(
              "absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing",
              selected?.id === stop.id ? "ring-2 ring-primary" : ""
            )}
            style={{ left: `${stop.position}%`, backgroundColor: `#${stop.color}` }}
          />
        ))}
      </div>

      {selected ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {labels.color}
            <input
              type="color"
              data-testid="gradient-stop-color"
              value={`#${selected.color}`}
              onChange={(event) => updateStop(selected.id, { color: normalizeHex(event.target.value) })}
              className="size-9 cursor-pointer rounded-md border border-border bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Hex
            <Input
              data-testid="gradient-stop-hex"
              value={`#${selected.color}`}
              onChange={(event) => updateStop(selected.id, { color: normalizeHex(event.target.value, selected.color) })}
              className="w-28 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {labels.position}
            <Input
              type="number"
              min={0}
              max={100}
              data-testid="gradient-stop-position"
              value={selected.position}
              onChange={(event) =>
                updateStop(selected.id, { position: normalizePosition(Number(event.target.value), selected.position) })
              }
              className="w-20 font-mono text-sm"
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeSelected}
            disabled={stops.length <= minColorStops}
          >
            <Trash2Icon data-icon="inline-start" />
            {labels.remove}
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{labels.hint}</p>
      {stops.length >= maxColorStops ? null : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            const id = nextStopId();
            const last = stops[stops.length - 1];
            onChange([...stops, { id, color: last?.color ?? "3e5c9e", position: 90 }]);
            setSelectedId(id);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          {labels.add}
        </Button>
      )}
    </div>
  );
}
