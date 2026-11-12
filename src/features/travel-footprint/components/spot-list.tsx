"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";
import { formatCoordinates, parseCoordinateInput, roundCoordinate } from "../lib/coordinates";
import { formatDistanceKm, haversineDistanceKm } from "../lib/geodesy";
import type { FootprintSpot } from "../lib/types";

type Labels = Pick<
  Messages["travelFootprint"],
  | "spotEmpty"
  | "spotName"
  | "spotDelete"
  | "editCoordinates"
  | "save"
  | "cancel"
  | "distanceUnit"
  | "coordLatitude"
  | "coordLongitude"
  | "coordInvalid"
>;

export function SpotList({
  spots,
  home,
  locale,
  labels,
  onRename,
  onDelete,
  onMove,
}: {
  spots: FootprintSpot[];
  home: FootprintSpot | null;
  locale: Locale;
  labels: Labels;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, latitude: number, longitude: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [invalid, setInvalid] = useState(false);

  function startEditing(spot: FootprintSpot) {
    setEditingId(spot.id);
    setLatitude(String(spot.latitude));
    setLongitude(String(spot.longitude));
    setInvalid(false);
  }

  function saveCoordinates(id: string) {
    const coordinates = parseCoordinateInput(latitude, longitude);
    if (!coordinates) {
      setInvalid(true);
      return;
    }

    onMove(id, roundCoordinate(coordinates.latitude), roundCoordinate(coordinates.longitude));
    setEditingId(null);
    setInvalid(false);
  }

  if (spots.length === 0) {
    return <p className="text-sm text-muted-foreground">{labels.spotEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {spots.map((spot, index) => (
        <li
          key={spot.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 px-2.5 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary">
              {index + 1}
            </span>
            <Input
              key={spot.id}
              defaultValue={spot.name}
              aria-label={labels.spotName}
              onBlur={(event) => onRename(spot.id, event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="h-8 min-w-0 flex-1"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={labels.editCoordinates}
              title={labels.editCoordinates}
              onClick={() => (editingId === spot.id ? setEditingId(null) : startEditing(spot))}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={labels.spotDelete}
              title={labels.spotDelete}
              onClick={() => onDelete(spot.id)}
            >
              <Trash2Icon />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-7 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatCoordinates(spot.latitude, spot.longitude)}
            </span>
            {home ? (
              <span className="tabular-nums">
                {formatDistanceKm(haversineDistanceKm(home, spot), locale)} {labels.distanceUnit}
              </span>
            ) : null}
          </div>

          {editingId === spot.id ? (
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  aria-label={labels.coordLatitude}
                  placeholder={labels.coordLatitude}
                  inputMode="decimal"
                  value={latitude}
                  onChange={(event) => {
                    setLatitude(event.currentTarget.value);
                    setInvalid(false);
                  }}
                  className="h-8"
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
                  className="h-8"
                />
              </div>
              {invalid ? (
                <p role="alert" className="text-xs text-destructive">
                  {labels.coordInvalid}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveCoordinates(spot.id)}>
                  {labels.save}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <XIcon />
                  {labels.cancel}
                </Button>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
