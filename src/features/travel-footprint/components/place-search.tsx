"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { searchPlaces, type GeocodingResult } from "@/features/travel-footprint/lib/geocoding";

export type PlaceSearchLabels = Pick<
  Messages["travelFootprint"],
  "searchPlaceholder" | "searching" | "searchNoResults" | "searchFailed"
>;

export type PlaceSearchSelection = {
  name: string;
  longitude: number;
  latitude: number;
};

/** Wait this long after the last keystroke before hitting the geocoder. */
const debounceMs = 300;

/** Two latin characters is the point where a query becomes meaningful. */
const minimumQueryLength = 2;

/** CJK ideographs, kana and hangul can be meaningful in a single character. */
const singleCharacterSearchPattern =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function meetsMinimumQueryLength(query: string): boolean {
  return query.length >= minimumQueryLength || singleCharacterSearchPattern.test(query);
}

type SearchStatus = "idle" | "loading" | "success" | "error";

export function PlaceSearch({
  labels,
  onSelect,
  className,
}: {
  labels: PlaceSearchLabels;
  onSelect: (place: PlaceSearchSelection) => void;
  className?: string;
}) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  // Drop any pending debounce/request when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  // Close the dropdown when a click lands outside the component.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  /** Cancels the in-flight timer and request, if any. */
  function cancelPending() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }

  /** Kicks off a request and publishes its result, ignoring aborted responses. */
  function runSearch(value: string) {
    const controller = new AbortController();
    abortRef.current = controller;

    searchPlaces(value, { signal: controller.signal })
      .then((places) => {
        if (controller.signal.aborted) return;
        setResults(places);
        setStatus("success");
        setHighlighted(-1);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("error");
        setHighlighted(-1);
      });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    cancelPending();

    const trimmed = value.trim();

    if (!meetsMinimumQueryLength(trimmed)) {
      setResults([]);
      setStatus("idle");
      setHighlighted(-1);
      setOpen(false);
      return;
    }

    setStatus("loading");
    setHighlighted(-1);
    setOpen(true);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      runSearch(trimmed);
    }, debounceMs);
  }

  function selectPlace(place: GeocodingResult) {
    onSelect({ name: place.name, longitude: place.longitude, latitude: place.latitude });
    cancelPending();
    setQuery("");
    setResults([]);
    setStatus("idle");
    setHighlighted(-1);
    setOpen(false);
  }

  function moveHighlight(delta: number) {
    if (results.length === 0) return;

    setHighlighted((current) => {
      const next = current + delta;

      if (next < 0) return results.length - 1;
      if (next >= results.length) return 0;
      return next;
    });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && results.length > 0) {
        setOpen(true);
        setHighlighted(0);
        return;
      }
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open && results.length > 0) {
        setOpen(true);
        setHighlighted(results.length - 1);
        return;
      }
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      if (open && highlighted >= 0 && highlighted < results.length) {
        event.preventDefault();
        selectPlace(results[highlighted]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
    }
  }

  const showListbox = status === "success" && results.length > 0;
  const activeDescendant =
    showListbox && highlighted >= 0 ? `${baseId}-option-${highlighted}` : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={showListbox ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        placeholder={labels.searchPlaceholder}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      {open && status !== "idle" ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {status === "loading" ? (
            <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
              {labels.searching}
            </div>
          ) : null}

          {status === "error" ? (
            <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
              {labels.searchFailed}
            </div>
          ) : null}

          {status === "success" && results.length === 0 ? (
            <div role="status" className="px-3 py-2 text-sm text-muted-foreground">
              {labels.searchNoResults}
            </div>
          ) : null}

          {showListbox ? (
            <ul role="listbox" id={listboxId} className="py-1">
              {results.map((place, index) => (
                <li
                  key={place.id}
                  id={`${baseId}-option-${index}`}
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPlace(place)}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-sm",
                    index === highlighted
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground",
                  )}
                >
                  {place.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
