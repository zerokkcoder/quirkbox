import type * as MapLibreGL from "maplibre-gl";
import { downloadCanvas } from "@/features/pixel-avatar/lib/export";
import { buildConnectors, unwrapLongitude, type LngLat } from "./geometry";
import { resolveLineStyle } from "./line-styles";
import type { TravelFootprintState } from "./types";

/** Stable, tool-specific download name. */
export const travelFootprintExportFilename = "quirkbox-travel-footprint.png";

export type TravelFootprintExportOptions = {
  /** The live MapLibre instance. It must have been created with `preserveDrawingBuffer`. */
  map: MapLibreGL.Map;
  state: TravelFootprintState;
  filename: string;
};

/**
 * Marker/label colors mirrored from the on-screen DOM markers. The WebGL basemap carries no
 * markers of its own, so the export layer redraws every dot and label by hand.
 */
const homeFill = "#e11d48";
const spotFill = "#3b82f6";
const markerRing = "#ffffff";
const labelFill = "#111827";
const labelHalo = "rgba(255, 255, 255, 0.9)";
const homeDotRadius = 8;
const spotDotRadius = 5;
const maximumLabelLength = 24;

function truncateLabel(name: string): string {
  return name.length > maximumLabelLength ? `${name.slice(0, maximumLabelLength - 1)}…` : name;
}

/** Filled dot with a white ring — matches the DOM marker's `border-2 border-white` look. */
function drawDot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  scale: number,
): void {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = 2 * scale;
  context.strokeStyle = markerRing;
  context.stroke();
}

/** Stroked-then-filled text so a label stays readable on both light and dark basemaps. */
function drawLabel(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
): void {
  context.font = `500 ${12 * scale}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.lineJoin = "round";
  context.lineWidth = 3 * scale;
  context.strokeStyle = labelHalo;
  context.strokeText(text, x, y);
  context.fillStyle = labelFill;
  context.fillText(text, x, y);
}

/**
 * Composes the current map into a downloadable PNG: the WebGL canvas supplies the basemap, then
 * a 2D overlay re-draws the connectors, the dots and the name labels (the DOM markers are absent
 * from the WebGL canvas). Connector geometry and paint come from the same helpers as the live
 * layer, so arcs, widths, dash patterns and connect mode all match what the user sees.
 */
export function exportTravelFootprintPng({
  map,
  state,
  filename,
}: TravelFootprintExportOptions): void {
  const { home, spots } = state;
  if (!home) return;

  const source = map.getCanvas();
  const scale = source.clientWidth > 0 ? source.width / source.clientWidth : 1;

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.drawImage(source, 0, 0);

  const style = resolveLineStyle(state);
  const centerLongitude = map.getCenter().lng;
  const project = ([longitude, latitude]: LngLat) =>
    map.project([unwrapLongitude(centerLongitude, longitude), latitude]);

  const connectors = buildConnectors(home, spots, state.connectMode, state.lineShape);

  context.save();
  context.strokeStyle = style.color;
  context.globalAlpha = style.opacity;
  context.lineWidth = style.width * scale;
  context.lineCap = style.lineCap;
  context.lineJoin = "round";
  if (style.dashArray) {
    context.setLineDash(style.dashArray.map((value) => value * style.width * scale));
  }

  for (const coordinates of connectors) {
    if (coordinates.length < 2) continue;
    context.beginPath();
    coordinates.forEach((coordinate, index) => {
      const point = project(coordinate);
      const x = point.x * scale;
      const y = point.y * scale;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }
  context.restore();

  // Dots and labels last, so they sit above the lines.
  for (const spot of spots) {
    const point = project([spot.longitude, spot.latitude]);
    const x = point.x * scale;
    const y = point.y * scale;
    drawDot(context, x, y, spotDotRadius * scale, spotFill, scale);
    drawLabel(context, truncateLabel(spot.name), x, y - (spotDotRadius + 4) * scale, scale);
  }

  const homePoint = project([home.longitude, home.latitude]);
  const homeX = homePoint.x * scale;
  const homeY = homePoint.y * scale;
  drawDot(context, homeX, homeY, homeDotRadius * scale, homeFill, scale);
  drawLabel(context, truncateLabel(home.name), homeX, homeY - (homeDotRadius + 4) * scale, scale);

  downloadCanvas(canvas, filename);
}
