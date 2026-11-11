import { describe, expect, it } from "vitest";
import { hashSeed } from "@/features/pixel-avatar/lib/seeds";

describe("pixel avatar seed helpers", () => {
  it("produces a stable hash for the same seed", () => {
    expect(hashSeed("quirkbox")).toBe(hashSeed("quirkbox"));
  });
});
