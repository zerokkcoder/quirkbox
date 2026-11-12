"use client";

import { useState, type FormEvent } from "react";
import { ChevronDownIcon, MapPinPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";
import { formatCoordinates, parseCoordinateInput } from "../lib/coordinates";

type Labels = Pick<
  Messages["travelFootprint"],
  | "addByCoordinates"
  | "coordName"
  | "coordLatitude"
  | "coordLongitude"
  | "coordInvalid"
  | "setAsHome"
  | "addFootprint"
>;

export type CoordinatePlace = {
  name: string;
  longitude: number;
  latitude: number;
};

export function CoordinateEntry({
  labels,
  onSetHome,
  onAddSpot,
  className,
}: {
  labels: Labels;
  onSetHome: (place: CoordinatePlace) => void;
  onAddSpot: (place: CoordinatePlace) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent, target: "home" | "spot") {
    event.preventDefault();
    const coordinates = parseCoordinateInput(latitude, longitude);

    if (!coordinates) {
      setInvalid(true);
      return;
    }

    const place: CoordinatePlace = {
      name: name.trim() || formatCoordinates(coordinates.latitude, coordinates.longitude),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    if (target === "home") onSetHome(place);
    else onAddSpot(place);

    setInvalid(false);
    setName("");
    setLatitude("");
    setLongitude("");
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card/40", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <MapPinPlusIcon className="size-4 text-muted-foreground" />
          {labels.addByCoordinates}
        </span>
        <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <form className="flex flex-col gap-2 border-t border-border p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              aria-label={labels.coordName}
              placeholder={labels.coordName}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Input
              aria-label={labels.coordLatitude}
              placeholder={labels.coordLatitude}
              inputMode="decimal"
              value={latitude}
              onChange={(event) => {
                setLatitude(event.currentTarget.value);
                setInvalid(false);
              }}
            />
            <Input
              aria-label={labels.coordLongitude}
              placeholder={labels.coordLongitude}
              inputMode="decimal"
              value={longitude}
              onChange={(event) => {
                setLongitude(event.currentTarget.value);
                setInvalid(false);
              }}
            />
          </div>

          {invalid ? (
            <p role="alert" className="text-xs text-destructive">
              {labels.coordInvalid}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="outline" onClick={(event) => submit(event, "home")}>
              {labels.setAsHome}
            </Button>
            <Button type="submit" size="sm" onClick={(event) => submit(event, "spot")}>
              {labels.addFootprint}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
