"use client";

import { useEffect, useMemo, useRef } from "react";
import type * as MapLibreGL from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { buildConnectors, connectorsToGeoJSON } from "../lib/geometry";
import { resolveLineStyle, rgba } from "../lib/line-styles";
import type { AnimationId, TravelFootprintState } from "../lib/types";

/**
 * A single GeoJSON source with three line layers (soft halo, main line, glowing
 * overlay). Keeping all connectors in one source means adding the 100th
 * footprint costs one setData call, not 100 React subtrees.
 *
 * The overlay is driven by `line-gradient` + `line-progress` rather than dash
 * arrays: a gradient has no cross-fade transition, so it can be updated every
 * frame without fighting MapLibre's paint interpolation.
 */
const sourceId = "travel-footprint-lines";
const haloLayerId = "travel-footprint-lines-halo";
const baseLayerId = "travel-footprint-lines-base";
const glowLayerId = "travel-footprint-lines-glow";

const animationPeriodMs = 2600;
const gradientSteps = 28;
const minimumFrameGapMs = 32;

function gradientExpression(
  animation: AnimationId,
  phase: number,
  color: string,
): MapLibreGL.ExpressionSpecification {
  const stops: (number | string)[] = [];

  for (let index = 0; index <= gradientSteps; index += 1) {
    const position = index / gradientSteps;
    let alpha = 0;

    if (animation === "pulse") {
      alpha = 0.1 + 0.5 * (0.5 + 0.5 * Math.cos(2 * Math.PI * phase));
    } else if (animation === "comet") {
      const center = 0.08 + phase * 0.84;
      const falloff = Math.max(0, 1 - Math.abs(position - center) / 0.14);
      alpha = 0.9 * falloff * falloff;
    } else if (animation === "flow") {
      const wave = Math.max(0, Math.cos(2 * Math.PI * (position * 3 - phase)));
      alpha = 0.9 * wave ** 4;
    }

    stops.push(position, rgba(color, alpha));
  }

  return ["interpolate", ["linear"], ["line-progress"], ...stops] as unknown as MapLibreGL.ExpressionSpecification;
}

/** The initial (invisible) gradient keeps the layer valid before the first frame. */
function emptyGradient(color: string): MapLibreGL.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["line-progress"],
    0,
    rgba(color, 0),
    1,
    rgba(color, 0),
  ] as unknown as MapLibreGL.ExpressionSpecification;
}

function lineLayout(): MapLibreGL.LineLayerSpecification["layout"] {
  return { "line-join": "round", "line-cap": "round" };
}

/**
 * Dash lengths are expressed in line widths, so the wider halo needs a
 * proportionally smaller pattern to keep its gaps aligned with the main line.
 */
function scaledDash(
  dash: [number, number] | undefined,
  baseWidth: number,
  targetWidth: number,
): [number, number] | undefined {
  if (!dash) return undefined;
  const ratio = baseWidth / targetWidth;
  return [dash[0] * ratio, dash[1] * ratio];
}

export function FootprintLines({ state }: { state: TravelFootprintState }) {
  const { map, isLoaded } = useMap();
  const resolved = useMemo(() => resolveLineStyle(state), [state]);
  const { animation, lineShape, connectMode, home, spots } = state;

  const geoJSON = useMemo(
    () => connectorsToGeoJSON(buildConnectors(home, spots, connectMode, lineShape)),
    [home, spots, connectMode, lineShape],
  );

  const latestPaintRef = useRef({ resolved });

  // Keep the rAF loop's color in sync without restarting it on every paint change.
  useEffect(() => {
    latestPaintRef.current = { resolved };
  }, [resolved]);

  // Source + layers. `isLoaded` goes false during a theme style swap, so this
  // tears down and re-adds exactly like the other mapcn layer components.
  useEffect(() => {
    if (!isLoaded || !map) return;

    const { resolved: paint } = latestPaintRef.current;
    const empty = connectorsToGeoJSON([]);
    const haloWidth = paint.width + 5;

    map.addSource(sourceId, {
      type: "geojson",
      data: empty,
      lineMetrics: true,
    });

    const layers: MapLibreGL.LineLayerSpecification[] = [
      {
        id: haloLayerId,
        type: "line",
        source: sourceId,
        layout: lineLayout(),
        paint: {
          "line-color": rgba(paint.color, 0.16),
          "line-width": haloWidth,
          "line-opacity": 1,
          ...(paint.dashArray
            ? { "line-dasharray": scaledDash(paint.dashArray, paint.width, haloWidth) }
            : {}),
        },
      },
      {
        id: baseLayerId,
        type: "line",
        source: sourceId,
        layout: lineLayout(),
        paint: {
          "line-color": paint.color,
          "line-width": paint.width,
          "line-opacity": paint.opacity,
          ...(paint.dashArray ? { "line-dasharray": paint.dashArray } : {}),
        },
      },
      {
        id: glowLayerId,
        type: "line",
        source: sourceId,
        layout: { ...lineLayout(), visibility: "none" },
        paint: {
          "line-gradient": emptyGradient(paint.color),
          "line-width": paint.width + 2,
          "line-opacity": 0.95,
        },
      },
    ];

    for (const layer of layers) {
      map.addLayer(layer);
    }

    return () => {
      try {
        for (const id of [glowLayerId, baseLayerId, haloLayerId]) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // The style may be mid-reload; the next isLoaded pass re-adds everything.
      }
    };
  }, [isLoaded, map]);

  // Geometry changes (add / remove / drag / edit / import).
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource | undefined;
    source?.setData(geoJSON);
  }, [isLoaded, map, geoJSON]);

  // Style changes (color / line type / width / animation toggle).
  useEffect(() => {
    if (!isLoaded || !map) return;
    if (!map.getLayer(baseLayerId) || !map.getLayer(haloLayerId) || !map.getLayer(glowLayerId)) return;

    const haloWidth = resolved.width + 5;
    map.setPaintProperty(haloLayerId, "line-color", rgba(resolved.color, 0.16));
    map.setPaintProperty(haloLayerId, "line-width", haloWidth);
    map.setPaintProperty(
      haloLayerId,
      "line-dasharray",
      scaledDash(resolved.dashArray, resolved.width, haloWidth),
    );
    map.setPaintProperty(baseLayerId, "line-color", resolved.color);
    map.setPaintProperty(baseLayerId, "line-width", resolved.width);
    map.setPaintProperty(baseLayerId, "line-opacity", resolved.opacity);
    map.setPaintProperty(baseLayerId, "line-dasharray", resolved.dashArray);
    map.setPaintProperty(glowLayerId, "line-width", resolved.width + 2);
    map.setLayoutProperty(glowLayerId, "visibility", animation === "none" ? "none" : "visible");
  }, [isLoaded, map, resolved, animation]);

  // One rAF loop per animation mode. It only touches a single paint property,
  // so React never re-renders while the lines are moving.
  useEffect(() => {
    if (!isLoaded || !map || animation === "none") return;

    let frame = 0;
    let lastFrameAt = 0;

    const tick = (timestamp: number) => {
      frame = window.requestAnimationFrame(tick);

      if (timestamp - lastFrameAt < minimumFrameGapMs) return;
      lastFrameAt = timestamp;

      if (!map.getLayer(glowLayerId)) return;
      const phase = (timestamp % animationPeriodMs) / animationPeriodMs;
      map.setPaintProperty(
        glowLayerId,
        "line-gradient",
        gradientExpression(animation, phase, latestPaintRef.current.resolved.color),
      );
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isLoaded, map, animation]);

  return null;
}
