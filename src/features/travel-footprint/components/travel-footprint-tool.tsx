"use client";

import {
  Component,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  DownloadIcon,
  FileDownIcon,
  FileUpIcon,
  FocusIcon,
  LocateFixedIcon,
  Trash2Icon,
} from "lucide-react";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
  type MapRef,
} from "@/components/ui/map";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CoordinateEntry, type CoordinatePlace } from "./coordinate-entry";
import { FootprintLines } from "./footprint-lines";
import {
  PlaceSearch,
  type PlaceSearchSelection,
} from "@/features/travel-footprint/components/place-search";
import { SpotList } from "./spot-list";
import {
  downloadTravelFootprintData,
  parseTravelFootprintFile,
} from "@/features/travel-footprint/lib/data-transfer";
import {
  exportTravelFootprintPng,
  travelFootprintExportFilename,
} from "@/features/travel-footprint/lib/export";
import { fitBoundsForPoints, findFurthestSpot, totalRouteDistanceKm } from "@/features/travel-footprint/lib/geometry";
import { formatCoordinates, roundCoordinate } from "@/features/travel-footprint/lib/coordinates";
import { formatDistanceKm } from "@/features/travel-footprint/lib/geodesy";
import {
  lineColorOptions,
  lineStyleOptions,
  normalizeLineWidth,
  resolveLineStyle,
  toAnimationId,
  toConnectModeId,
  toLineColorId,
  toLineShapeId,
  toLineStyleId,
} from "@/features/travel-footprint/lib/line-styles";
import {
  readTravelFootprintState,
  writeTravelFootprintState,
} from "@/features/travel-footprint/lib/storage";
import {
  animationIds,
  connectModeIds,
  DEFAULT_TRAVEL_FOOTPRINT_STATE,
  lineShapeIds,
  lineWidthRange,
  type AnimationId,
  type ConnectModeId,
  type FootprintSpot,
  type LineColorId,
  type LineShapeId,
  type LineStyleId,
  type TravelFootprintState,
} from "@/features/travel-footprint/lib/types";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { getMessages, type Messages } from "@/lib/i18n";
import { createSeed } from "@/lib/seeds";
import { cn } from "@/lib/utils";

/** How long MapLibre gets to reach "loaded" before the map is treated as broken. */
const mapLoadTimeoutMs = 9000;

/** Default zoom when only a single point exists (fitBounds on one point is undefined). */
const singlePointZoom = 9;

type Labels = Messages["travelFootprint"];

function createSpot(latitude: number, longitude: number, name: string): FootprintSpot {
  return { id: `spot-${createSeed(12)}`, name, longitude, latitude };
}

/**
 * Serializes the fit target as `"lng,lat;lng,lat"`. Its value only changes when the point set
 * itself changes, so it doubles as the effect dependency that keeps the viewport from being
 * re-fitted on every keystroke.
 */
function parsePointsSignature(signature: string): { longitude: number; latitude: number }[] {
  if (signature.length === 0) return [];

  return signature.split(";").map((pair) => {
    const [longitude, latitude] = pair.split(",");
    return { longitude: Number(longitude), latitude: Number(latitude) };
  });
}

/**
 * Catches render-time throws from the map subtree (MapLibre failing to load, a missing WebGL
 * context, …). It notifies the parent so the error state and the disabled export button stay in
 * sync, and swallows the failure instead of blanking the whole tool.
 */
class MapErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return <div className="h-full w-full" aria-hidden="true" />;
    return this.props.children;
  }
}

/**
 * Lives inside `<Map>` so it can reach the MapLibre instance: wires up click-to-drop, reports
 * load/error, and re-fits the viewport whenever the point set changes or "fit view" is pressed.
 */
function MapBridge({
  pointsSignature,
  fitNonce,
  onMapClick,
  onMapReady,
  onMapError,
}: {
  pointsSignature: string;
  fitNonce: number;
  onMapClick: (longitude: number, latitude: number) => void;
  onMapReady: () => void;
  onMapError: () => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = (event: { lngLat: { lng: number; lat: number } }) => {
      onMapClick(event.lngLat.lng, event.lngLat.lat);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  useEffect(() => {
    if (isLoaded) onMapReady();
  }, [isLoaded, onMapReady]);

  // Before the first successful load, any map error is treated as fatal.
  useEffect(() => {
    if (!map || isLoaded) return;
    const handleError = () => onMapError();
    map.on("error", handleError);
    return () => {
      map.off("error", handleError);
    };
  }, [map, isLoaded, onMapError]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const points = parsePointsSignature(pointsSignature);
    if (points.length === 0) return;

    if (points.length === 1) {
      map.easeTo({
        center: [points[0].longitude, points[0].latitude],
        zoom: singlePointZoom,
        duration: 800,
      });
      return;
    }

    const bounds = fitBoundsForPoints(points);
    if (!bounds) return;

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: 72, maxZoom: 10, duration: 900 },
    );
  }, [map, isLoaded, pointsSignature, fitNonce]);

  return null;
}

function PanelSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { id: T; label: string; swatch?: string }[];
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      className={className ?? "w-full flex-wrap justify-start"}
      value={[value]}
      onValueChange={(values) => {
        const next = values[0];
        if (next) onChange(next as T);
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.id} value={option.id} aria-label={option.label}>
          {option.swatch ? (
            <span
              aria-hidden="true"
              className="size-3 rounded-full border border-border"
              style={{ backgroundColor: option.swatch }}
            />
          ) : null}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function StyleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function TravelFootprintTool({
  locale,
  labels,
  theme,
  compact = false,
}: {
  locale: Locale;
  labels: Labels;
  /** Force a basemap theme. The desktop shell puts `.dark` on a wrapper, not on <html>. */
  theme?: "light" | "dark";
  /** Shorter map without sticky docking, for the small desktop windows. */
  compact?: boolean;
}) {
  const [state, setState] = useState<TravelFootprintState>(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [fitNonce, setFitNonce] = useState(0);
  const [importStatus, setImportStatus] = useState<"" | "success" | "error">("");

  const mapRef = useRef<MapRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapReadyRef = useRef(false);

  const shareLabels = getMessages(locale).share;
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/travel-footprint")}`;

  // Hydrate from localStorage after mount so the SSR frame and the first client frame stay empty.
  useEffect(() => {
    startTransition(() => {
      setState(readTravelFootprintState());
      setHydrated(true);
    });
  }, []);

  // Persist only once hydrated, otherwise the empty initial state would overwrite stored data.
  useEffect(() => {
    if (!hydrated) return;
    writeTravelFootprintState(state);
  }, [hydrated, state]);

  // A map that never reports ready within the budget is treated as failed (e.g. blocked tiles).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!mapReadyRef.current) setMapFailed(true);
    }, mapLoadTimeoutMs);
    return () => window.clearTimeout(timer);
  }, []);

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    setMapFailed(false);
    setMapReady(true);
  }, []);

  const handleMapError = useCallback(() => setMapFailed(true), []);

  const addPlace = useCallback(
    (place: CoordinatePlace, target: "auto" | "home" | "spot") => {
      setState((current) => {
        const spot = createSpot(place.latitude, place.longitude, place.name);

        if (target === "home" || (target === "auto" && current.home === null)) {
          return { ...current, home: spot };
        }

        return { ...current, spots: [...current.spots, spot] };
      });
    },
    [],
  );

  const handleMapClick = useCallback(
    (longitude: number, latitude: number) => {
      const lat = roundCoordinate(latitude);
      const lng = roundCoordinate(longitude);
      addPlace({ latitude: lat, longitude: lng, name: formatCoordinates(lat, lng) }, "auto");
    },
    [addPlace],
  );

  const handleSelect = useCallback(
    (place: PlaceSearchSelection) => addPlace(place, "auto"),
    [addPlace],
  );

  const handleSetHome = useCallback(
    (place: CoordinatePlace) => addPlace(place, "home"),
    [addPlace],
  );

  const handleAddSpot = useCallback(
    (place: CoordinatePlace) => addPlace(place, "spot"),
    [addPlace],
  );

  const handleUseMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationFailed(true);
      return;
    }

    setLocating(true);
    setLocationFailed(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setLocating(false);
        handleSetHome({
          latitude: roundCoordinate(latitude),
          longitude: roundCoordinate(longitude),
          name: formatCoordinates(roundCoordinate(latitude), roundCoordinate(longitude)),
        });
      },
      () => {
        setLocating(false);
        setLocationFailed(true);
      },
      { timeout: 10000 },
    );
  }, [handleSetHome]);

  function updateHome(patch: Partial<FootprintSpot>) {
    setState((current) =>
      current.home ? { ...current, home: { ...current.home, ...patch } } : current,
    );
  }

  function clearHome() {
    setState((current) => ({ ...current, home: null }));
  }

  function renameHome(name: string) {
    const trimmed = name.trim();
    if (trimmed.length > 0) updateHome({ name: trimmed });
  }

  function moveHome(latitude: number, longitude: number) {
    updateHome({ latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) });
  }

  function renameSpot(id: string, name: string) {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    setState((current) => ({
      ...current,
      spots: current.spots.map((spot) => (spot.id === id ? { ...spot, name: trimmed } : spot)),
    }));
  }

  function removeSpot(id: string) {
    setState((current) => ({ ...current, spots: current.spots.filter((spot) => spot.id !== id) }));
  }

  function moveSpot(id: string, latitude: number, longitude: number) {
    setState((current) => ({
      ...current,
      spots: current.spots.map((spot) =>
        spot.id === id
          ? { ...spot, latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) }
          : spot,
      ),
    }));
  }

  function setStyle<K extends "lineStyle" | "lineColor" | "lineWidth" | "animation" | "lineShape" | "connectMode">(
    key: K,
    value: TravelFootprintState[K],
  ) {
    setState((current) => ({ ...current, [key]: value }));
  }

  const handleExportData = useCallback(() => downloadTravelFootprintData(state), [state]);

  const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const parsed = parseTravelFootprintFile(await file.text());
      if (!parsed) {
        setImportStatus("error");
      } else {
        setState(parsed);
        setImportStatus("success");
        setFitNonce((nonce) => nonce + 1);
      }
    } catch {
      setImportStatus("error");
    } finally {
      input.value = "";
    }
  }, []);

  function clearAll() {
    if (!window.confirm(labels.clearConfirm)) return;
    setState({ ...DEFAULT_TRAVEL_FOOTPRINT_STATE, spots: [] });
    setImportStatus("");
  }

  const pointsSignature = useMemo(() => {
    const parts: string[] = [];
    if (state.home) parts.push(`${state.home.longitude},${state.home.latitude}`);
    for (const spot of state.spots) parts.push(`${spot.longitude},${spot.latitude}`);
    return parts.join(";");
  }, [state.home, state.spots]);

  const totalDistanceKm = useMemo(
    () => totalRouteDistanceKm(state.home, state.spots, state.connectMode),
    [state.home, state.spots, state.connectMode],
  );
  const furthest = useMemo(
    () => findFurthestSpot(state.home, state.spots),
    [state.home, state.spots],
  );
  const resolvedStyle = useMemo(() => resolveLineStyle(state), [state]);

  const exportDisabledReason = !state.home
    ? labels.exportNeedsHome
    : !mapReady || mapFailed
      ? labels.exportMapUnavailable
      : "";
  const exportDisabled = exportDisabledReason.length > 0;

  const handleExportPng = useCallback(() => {
    const map = mapRef.current;
    if (!map || !state.home) return;

    exportTravelFootprintPng({
      map,
      state,
      filename: travelFootprintExportFilename,
    });
  }, [state]);

  const home = state.home;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col gap-2">
        <div
          data-testid="travel-footprint-map"
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border bg-muted/20",
            compact
              ? "h-[360px] sm:h-[420px]"
              : "h-[460px] sm:h-[560px] xl:sticky xl:top-(--tool-sticky-top,1rem) xl:self-start",
          )}
        >
          <MapErrorBoundary onError={handleMapError}>
            <Map
              ref={mapRef}
              theme={theme}
              canvasContextAttributes={{ preserveDrawingBuffer: true }}
              renderWorldCopies
              className="h-full w-full"
            >
              <MapControls showZoom showCompass />
              <MapBridge
                pointsSignature={pointsSignature}
                fitNonce={fitNonce}
                onMapClick={handleMapClick}
                onMapReady={handleMapReady}
                onMapError={handleMapError}
              />

              <FootprintLines state={state} />

              {home ? (
                <MapMarker
                  longitude={home.longitude}
                  latitude={home.latitude}
                  draggable
                  onDragEnd={({ lng, lat }) => moveHome(lat, lng)}
                >
                  <MarkerContent className="flex flex-col items-center">
                    <span className="block size-5 rounded-full border-2 border-white bg-rose-600 shadow-md" />
                    <span className="mt-0.5 max-w-36 truncate rounded bg-background/90 px-1 text-[10px] leading-tight font-medium text-foreground ring-1 ring-border">
                      {home.name}
                    </span>
                  </MarkerContent>
                </MapMarker>
              ) : null}

              {state.spots.map((spot, index) => (
                <MapMarker
                  key={spot.id}
                  longitude={spot.longitude}
                  latitude={spot.latitude}
                  draggable
                  onDragEnd={({ lng, lat }) => moveSpot(spot.id, lat, lng)}
                >
                  <MarkerContent className="flex flex-col items-center">
                    <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[9px] font-semibold text-white shadow">
                      {index + 1}
                    </span>
                    <span className="mt-0.5 max-w-32 truncate rounded bg-background/90 px-1 text-[10px] leading-tight text-foreground ring-1 ring-border">
                      {spot.name}
                    </span>
                  </MarkerContent>
                </MapMarker>
              ))}
            </Map>
          </MapErrorBoundary>

          <div className="absolute top-2 left-2 z-10">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/90 shadow-sm"
              onClick={() => setFitNonce((nonce) => nonce + 1)}
            >
              <FocusIcon data-icon="inline-start" />
              {labels.fitView}
            </Button>
          </div>

          <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border">
            {labels.mapHint}
          </div>

          {mapFailed ? (
            <div
              role="status"
              data-testid="travel-footprint-map-error"
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 p-6 text-center text-sm text-muted-foreground"
            >
              {labels.mapError}
            </div>
          ) : !mapReady ? (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70 text-sm text-muted-foreground"
            >
              {labels.mapLoading}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <PanelSection title={labels.home}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {home ? (
                <Input
                  key={home.id}
                  defaultValue={home.name}
                  aria-label={labels.homeName}
                  onBlur={(event) => renameHome(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  className="h-8 min-w-0 flex-1"
                />
              ) : (
                <span role="status" className="text-sm font-medium">
                  {labels.homeUnset}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleUseMyLocation} disabled={locating}>
                <LocateFixedIcon data-icon="inline-start" />
                {locating ? labels.locating : labels.useMyLocation}
              </Button>
              {home ? (
                <Button variant="ghost" size="sm" onClick={clearHome}>
                  {labels.clearHome}
                </Button>
              ) : null}
            </div>

            {home ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatCoordinates(home.latitude, home.longitude)}
              </span>
            ) : (
              <p className="text-xs text-muted-foreground">{labels.homeHint}</p>
            )}

            {locationFailed ? (
              <p role="status" className="text-xs text-destructive">
                {labels.locationFailed}
              </p>
            ) : null}
          </div>
        </PanelSection>

        <PanelSection
          title={labels.spotList}
          action={
            <span className="text-xs tabular-nums text-muted-foreground">
              {labels.spotCount} · {state.spots.length}
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            <PlaceSearch labels={labels} onSelect={handleSelect} className="w-full" />
            <CoordinateEntry
              labels={labels}
              onSetHome={handleSetHome}
              onAddSpot={handleAddSpot}
            />
            <SpotList
              spots={state.spots}
              home={home}
              locale={locale}
              labels={labels}
              onRename={renameSpot}
              onDelete={removeSpot}
              onMove={moveSpot}
            />
          </div>
        </PanelSection>

        <PanelSection title={labels.lineStyle}>
          <div className="flex flex-col gap-3">
            <StyleRow label={labels.lineStyle}>
              <OptionToggle<LineStyleId>
                value={state.lineStyle}
                options={lineStyleOptions.map((option) => ({
                  id: option.id,
                  label: labels.lineStyles[option.id],
                }))}
                onChange={(id) => {
                  const next = toLineStyleId(id);
                  if (next) setStyle("lineStyle", next);
                }}
              />
            </StyleRow>

            <StyleRow label={labels.lineColor}>
              <OptionToggle<LineColorId>
                value={state.lineColor}
                options={lineColorOptions.map((option) => ({
                  id: option.id,
                  label: labels.lineColors[option.id],
                  swatch: option.hex,
                }))}
                onChange={(id) => {
                  const next = toLineColorId(id);
                  if (next) setStyle("lineColor", next);
                }}
              />
            </StyleRow>

            <StyleRow label={`${labels.lineWidth} · ${resolvedStyle.width} px`}>
              <input
                type="range"
                aria-label={labels.lineWidth}
                min={lineWidthRange.min}
                max={lineWidthRange.max}
                step={lineWidthRange.step}
                value={state.lineWidth}
                onChange={(event) => setStyle("lineWidth", normalizeLineWidth(Number(event.currentTarget.value)))}
                className="h-2 w-full cursor-pointer"
                style={{ accentColor: resolvedStyle.color }}
              />
            </StyleRow>

            <StyleRow label={labels.lineAnimation}>
              <OptionToggle<AnimationId>
                value={state.animation}
                options={animationIds.map((id) => ({ id, label: labels.animations[id] }))}
                onChange={(id) => {
                  const next = toAnimationId(id);
                  if (next) setStyle("animation", next);
                }}
              />
            </StyleRow>

            <StyleRow label={labels.lineShape}>
              <OptionToggle<LineShapeId>
                value={state.lineShape}
                options={lineShapeIds.map((id) => ({ id, label: labels.shapes[id] }))}
                onChange={(id) => {
                  const next = toLineShapeId(id);
                  if (next) setStyle("lineShape", next);
                }}
              />
            </StyleRow>

            <StyleRow label={labels.connectMode}>
              <OptionToggle<ConnectModeId>
                value={state.connectMode}
                options={connectModeIds.map((id) => ({ id, label: labels.modes[id] }))}
                onChange={(id) => {
                  const next = toConnectModeId(id);
                  if (next) setStyle("connectMode", next);
                }}
              />
            </StyleRow>
          </div>
        </PanelSection>

        <PanelSection title={labels.dataTitle}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                <div className="text-[11px] text-muted-foreground">{labels.totalDistance}</div>
                <div className="text-sm font-semibold tabular-nums">
                  {home ? `${formatDistanceKm(totalDistanceKm, locale)} ${labels.distanceUnit}` : "—"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                <div className="text-[11px] text-muted-foreground">{labels.furthest}</div>
                <div className="truncate text-sm font-semibold" title={furthest?.spot.name}>
                  {furthest ? furthest.spot.name : "—"}
                </div>
              </div>
              <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                <div className="text-[11px] text-muted-foreground">{labels.spotCount}</div>
                <div className="text-sm font-semibold tabular-nums">{state.spots.length}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportPng} disabled={exportDisabled} title={exportDisabledReason || undefined}>
                <DownloadIcon data-icon="inline-start" />
                {labels.export}
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <FileDownIcon data-icon="inline-start" />
                {labels.exportJson}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileUpIcon data-icon="inline-start" />
                {labels.importJson}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button variant="ghost" onClick={clearAll}>
                <Trash2Icon data-icon="inline-start" />
                {labels.clearAll}
              </Button>
            </div>

            {exportDisabledReason ? (
              <p role="status" className="text-xs text-muted-foreground">
                {exportDisabledReason}
              </p>
            ) : null}
            {importStatus ? (
              <p role="status" className={importStatus === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {importStatus === "error" ? labels.importFailed : labels.importSuccess}
              </p>
            ) : null}

            <ShareToXButton
              labels={shareLabels}
              tool="travel-footprint"
              title={labels.title}
              description={labels.description}
              url={shareUrl}
            />
          </div>
        </PanelSection>
      </div>
    </div>
  );
}
