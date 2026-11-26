import { getCenterPoint, type ColorStop, type GradientState } from "./types";

export function sortedStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position);
}

export function stopToCss(stop: ColorStop): string {
  return `#${stop.color.replace(/^#/, "")} ${stop.position}%`;
}

/** Complete CSS `background-image` value, ready to paste. */
export function buildCssGradient(state: GradientState): string {
  const stops = sortedStops(state.stops).map(stopToCss).join(", ");
  const { x, y } = getCenterPoint(state.center);

  if (state.type === "radial") {
    return `radial-gradient(circle at ${x}% ${y}%, ${stops})`;
  }

  if (state.type === "conic") {
    return `conic-gradient(from ${state.angle}deg at ${x}% ${y}%, ${stops})`;
  }

  return `linear-gradient(${state.angle}deg, ${stops})`;
}

/** `createConicGradient` is unavailable in older engines — callers disable that option. */
export function supportsConicGradient(ctx: CanvasRenderingContext2D): boolean {
  return typeof ctx.createConicGradient === "function";
}

/** Feature probe for the UI; safe to call from a click handler. */
export function canUseConicGradient(): boolean {
  if (typeof document === "undefined") return false;
  const ctx = document.createElement("canvas").getContext("2d");
  return ctx !== null && supportsConicGradient(ctx);
}

/**
 * Paints the gradient onto a 2D context at the given pixel size.
 * CSS angle convention (0deg = up, clockwise) is converted to canvas coordinates.
 */
export function paintGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: GradientState
): void {
  const stops = sortedStops(state.stops);
  const center = getCenterPoint(state.center);
  const cx = (center.x / 100) * width;
  const cy = (center.y / 100) * height;

  let gradient: CanvasGradient;

  if (state.type === "radial") {
    const radius = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(width - cx, cy),
      Math.hypot(cx, height - cy),
      Math.hypot(width - cx, height - cy)
    );
    gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  } else if (state.type === "conic" && supportsConicGradient(ctx)) {
    gradient = ctx.createConicGradient((state.angle * Math.PI) / 180 - Math.PI / 2, cx, cy);
  } else {
    const radians = (state.angle * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const length = Math.abs(width * dx) + Math.abs(height * dy);
    gradient = ctx.createLinearGradient(
      width / 2 - (dx * length) / 2,
      height / 2 - (dy * length) / 2,
      width / 2 + (dx * length) / 2,
      height / 2 + (dy * length) / 2
    );
  }

  for (const stop of stops) {
    gradient.addColorStop(stop.position / 100, `#${stop.color.replace(/^#/, "")}`);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/** Optional sample text overlay so users can judge icon/text legibility. */
export function paintSampleText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
): void {
  const fontSize = Math.max(20, Math.round(Math.min(width, height) * 0.055));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = fontSize * 0.35;
  ctx.fillText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
}
