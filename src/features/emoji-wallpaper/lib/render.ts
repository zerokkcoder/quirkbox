import {
  buildEmojiLayout,
  type EmojiFormat,
  type EmojiPatternId,
  type EmojiPlacement,
  type EmojiTone,
} from "@/features/emoji-wallpaper/lib/patterns";

export const emojiFontStack =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export type EmojiWallpaperRenderOptions = {
  emojiPool: string[];
  seed: string;
  width: number;
  height: number;
  columns: number;
  pattern: EmojiPatternId;
  background: string;
  swatch: string;
  tone: EmojiTone;
};

/** Reused offscreen canvas for mono rendering, resized on demand instead of rebuilt per frame. */
let monoScratchCanvas: HTMLCanvasElement | null = null;

function getMonoScratchCanvas(width: number, height: number) {
  if (!monoScratchCanvas) {
    monoScratchCanvas = document.createElement("canvas");
  }

  if (monoScratchCanvas.width !== width) {
    monoScratchCanvas.width = width;
  }

  if (monoScratchCanvas.height !== height) {
    monoScratchCanvas.height = height;
  }

  return monoScratchCanvas;
}

function drawEmojis(ctx: CanvasRenderingContext2D, placements: EmojiPlacement[]) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const placement of placements) {
    ctx.save();
    ctx.translate(placement.x, placement.y);

    if (placement.rotation !== 0) {
      ctx.rotate(placement.rotation);
    }

    ctx.font = `${placement.size}px ${emojiFontStack}`;
    ctx.fillText(placement.emoji, 0, 0);
    ctx.restore();
  }
}

/**
 * Draws the wallpaper onto `canvas`. Sizes the canvas (which clears it), paints the background and
 * then either paints the colour emoji directly or, in mono mode, projects them through a swatch
 * tinted silhouette.
 */
export function renderEmojiWallpaper(canvas: HTMLCanvasElement, options: EmojiWallpaperRenderOptions): void {
  const { width, height, background, swatch, tone } = options;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const placements = buildEmojiLayout({
    emojiPool: options.emojiPool,
    seed: options.seed,
    width,
    height,
    columns: options.columns,
    pattern: options.pattern,
  });

  if (tone === "mono") {
    const scratch = getMonoScratchCanvas(width, height);
    const scratchCtx = scratch.getContext("2d");

    if (!scratchCtx) {
      return;
    }

    scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
    scratchCtx.globalCompositeOperation = "source-over";
    scratchCtx.clearRect(0, 0, width, height);
    drawEmojis(scratchCtx, placements);

    // Keep only the emoji pixels and repaint them in the swatch colour.
    scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
    scratchCtx.globalCompositeOperation = "source-in";
    scratchCtx.fillStyle = swatch;
    scratchCtx.fillRect(0, 0, width, height);
    scratchCtx.globalCompositeOperation = "source-over";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(scratch, 0, 0);
    return;
  }

  drawEmojis(ctx, placements);
}

/**
 * Renders the wallpaper on a dedicated offscreen canvas at full resolution and triggers a download.
 * Meant to be called from a client-side event handler.
 */
export function exportWallpaper(
  options: EmojiWallpaperRenderOptions & { ratio: string; format: EmojiFormat }
): void {
  if (typeof document === "undefined") {
    return;
  }

  const canvas = document.createElement("canvas");
  renderEmojiWallpaper(canvas, options);

  const dataUrl =
    options.format === "jpg" ? canvas.toDataURL("image/jpeg", 0.92) : canvas.toDataURL("image/png");
  const ratioSlug = options.ratio.replace(/:/g, "x");
  const filename = `quirkbox-emoji-wallpaper-${ratioSlug}-${options.seed}.${options.format}`;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
