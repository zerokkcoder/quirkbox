"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  allZoneOptions,
  filterZones,
  groupZones,
} from "@/features/unix-timestamp-converter/lib/timezones";
import { localZoneId } from "@/features/unix-timestamp-converter/lib/types";

type PickerLabels = {
  zoneLocalLabel: string;
  zoneSearchPlaceholder: string;
  zoneNoResults: string;
};

/**
 * Searchable IANA time-zone combobox with area-grouped options. The input is
 * the combobox itself: focusing opens the list, typing filters it, and the
 * list is only mounted while open so the full ICU list never reaches SSR HTML.
 */
export function TimezonePicker({
  value,
  onChange,
  labels,
  className = "",
}: {
  value: string;
  onChange: (zone: string) => void;
  labels: PickerLabels;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const allZones = useMemo(() => allZoneOptions(), []);
  const filtered = useMemo(() => filterZones(allZones, query), [allZones, query]);
  const groups = useMemo(() => groupZones(filtered), [filtered]);
  const flat = useMemo(() => groups.flatMap((group) => group.zones), [groups]);

  const displayValue = value === localZoneId ? labels.zoneLocalLabel : value;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function select(zone: string) {
    onChange(zone);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (flat.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + flat.length) % flat.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (open && flat[activeIndex]) {
        select(flat[activeIndex]);
      }
    }
  }

  let flatCursor = -1;

  return (
    <div className="relative" ref={rootRef} data-testid="ts-zone">
      <div className="relative">
        <input
          ref={inputRef}
          id="ts-zone"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="ts-zone-listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            open && flat.length > 0 ? `ts-zone-opt-${activeIndex}` : undefined
          }
          value={open ? query : displayValue}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={labels.zoneSearchPlaceholder}
          spellCheck={false}
          autoComplete="off"
          className={`${className} pr-8`}
          data-testid="ts-zone-search"
        />
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          <div id="ts-zone-listbox" role="listbox" ref={listRef}>
            {groups.length === 0 ? (
              <p
                className="px-2 py-3 text-sm text-muted-foreground"
                data-testid="ts-zone-empty"
              >
                {labels.zoneNoResults}
              </p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={group.label === localZoneId ? labels.zoneLocalLabel : group.label}
                >
                  <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {group.label === localZoneId ? labels.zoneLocalLabel : group.label}
                  </p>
                  {group.zones.map((zone) => {
                    flatCursor += 1;
                    const index = flatCursor;
                    return (
                      <div
                        key={zone}
                        id={`ts-zone-opt-${index}`}
                        role="option"
                        aria-selected={zone === value}
                        data-active={index === activeIndex}
                        data-testid="ts-zone-option"
                        data-zone={zone}
                        onClick={() => select(zone)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                          index === activeIndex ? "bg-hover" : ""
                        } ${zone === value ? "text-primary" : ""}`}
                      >
                        <span className="min-w-0 truncate">
                          {zone === localZoneId ? labels.zoneLocalLabel : zone}
                        </span>
                        {zone === value ? (
                          <CheckIcon className="size-3.5 shrink-0" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
