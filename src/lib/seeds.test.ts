import { describe, expect, it } from "vitest";
import { hashSeed } from "@/lib/seeds";

describe("shared seed helpers", () => {
  it("produces a stable hash for the same seed", () => {
    expect(hashSeed("quirkbox")).toBe(hashSeed("quirkbox"));
  });
});
