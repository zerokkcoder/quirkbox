import { afterEach, describe, expect, it, vi } from "vitest";
import { pickRandom, randomIndex, shuffle } from "./random";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("randomIndex", () => {
  it("stays inside the requested range", () => {
    for (let i = 0; i < 200; i += 1) {
      const value = randomIndex(7776);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7776);
    }
  });

  it("rejects and retries values at or above the sampling limit", () => {
    const sequence = [0xffffffff, 5];
    let calls = 0;
    vi.stubGlobal("crypto", {
      getRandomValues: (buffer: Uint32Array) => {
        buffer[0] = sequence[calls];
        calls += 1;
        return buffer;
      },
    });

    expect(randomIndex(10)).toBe(5);
    expect(calls).toBe(2);
  });

  it("rejects invalid maxima", () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(1.5)).toThrow(RangeError);
  });
});

describe("shuffle", () => {
  it("keeps every element", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(shuffle(items).sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("does not mutate the input", () => {
    const items = ["a", "b", "c"];
    shuffle(items);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("pickRandom", () => {
  it("throws on an empty list", () => {
    expect(() => pickRandom([])).toThrow(RangeError);
  });
});
