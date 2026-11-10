import { describe, expect, it } from "vitest";
import { createSeededRandom, hashSeed } from "@/features/pixel-avatar/lib/seeds";

describe("pixel avatar seed helpers", () => {
  it("produces a stable hash for the same seed", () => {
    expect(hashSeed("quirkbox")).toBe(hashSeed("quirkbox"));
  });

  it("produces the same random sequence for the same seed", () => {
    const first = createSeededRandom("pixel-fun");
    const second = createSeededRandom("pixel-fun");

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });
});
