import { describe, expect, it } from "vitest";
import {
  buildEmojiLayout,
  emojiPatternIds,
  type EmojiPatternId,
} from "@/features/emoji-wallpaper/lib/patterns";

const emojiPool = ["🚀", "🛸", "🪐", "⭐", "🌙", "☄️"];
const columns = 6;
const width = 600;
const height = 1200;
const cell = width / columns;

function layout(pattern: EmojiPatternId, overrides: Partial<Parameters<typeof buildEmojiLayout>[0]> = {}) {
  return buildEmojiLayout({ emojiPool, seed: "seed-one", width, height, columns, pattern, ...overrides });
}

describe("buildEmojiLayout", () => {
  it("lays grid cells on an even lattice with no rotation", () => {
    const placements = layout("grid");

    expect(placements[1].x - placements[0].x).toBeCloseTo(cell, 6);
    expect(placements[columns].y - placements[0].y).toBeCloseTo(cell, 6);
    expect(placements[columns].x).toBeCloseTo(placements[0].x, 6);
    expect(placements.every((placement) => placement.rotation === 0)).toBe(true);
  });

  it("offsets odd brick rows by half a cell", () => {
    const placements = layout("brick");

    for (let col = 0; col < columns; col += 1) {
      const evenRow = placements[col];
      const oddRow = placements[columns + col];

      expect(oddRow.x - evenRow.x).toBeCloseTo(cell / 2, 6);
    }

    expect(placements.every((placement) => placement.rotation === 0)).toBe(true);
  });

  it("shifts wave rows along a sine curve", () => {
    const placements = layout("wave");

    expect(placements[columns].y).not.toBeCloseTo(placements[0].y, 6);

    placements.forEach((placement, index) => {
      const row = Math.floor(index / columns);
      const baseY = row * cell + cell / 2;

      expect(Math.abs(placement.y - baseY)).toBeLessThanOrEqual(cell * 0.3 + 1e-6);
    });
  });

  it("scatters cells with independent jitter, rotation and scale", () => {
    const placements = layout("scatter");
    const baseSize = cell * 0.86;

    expect(placements.some((placement) => placement.rotation !== 0)).toBe(true);

    for (const placement of placements) {
      expect(Math.abs(placement.rotation)).toBeLessThanOrEqual((20 * Math.PI) / 180 + 1e-9);
      expect(placement.size).toBeGreaterThanOrEqual(baseSize * 0.85 - 1e-6);
      expect(placement.size).toBeLessThanOrEqual(baseSize * 1.15 + 1e-6);
    }
  });

  it("rebuilds identical layouts for the same seed and options", () => {
    for (const pattern of emojiPatternIds) {
      expect(layout(pattern)).toEqual(layout(pattern));
    }
  });

  it("changes the scatter layout between seeds", () => {
    expect(layout("scatter", { seed: "alpha" })).not.toEqual(layout("scatter", { seed: "bravo" }));
  });

  it("keeps grid centers inside the canvas", () => {
    for (const placement of layout("grid")) {
      expect(placement.x).toBeGreaterThanOrEqual(0);
      expect(placement.x).toBeLessThanOrEqual(width);
      expect(placement.y).toBeGreaterThanOrEqual(0);
      expect(placement.y).toBeLessThanOrEqual(height);
    }
  });

  it("falls back to a safe emoji when the pool is empty", () => {
    const placements = layout("grid", { emojiPool: [] });

    expect(placements.length).toBeGreaterThan(0);
    expect(placements.every((placement) => placement.emoji.length > 0)).toBe(true);
    expect(placements.every((placement) => Number.isFinite(placement.x) && Number.isFinite(placement.size))).toBe(
      true
    );
  });
});
