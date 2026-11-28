import { describe, expect, it } from "vitest";
import {
  estimateEntropy,
  passphraseEntropy,
  passwordEntropy,
  shouldShowWeakHint,
  weakEntropyThreshold,
} from "./entropy";
import { defaultState, presets, type GeneratorState } from "./types";

function state(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return { ...defaultState, ...overrides };
}

describe("passwordEntropy", () => {
  it("matches length x log2(pool)", () => {
    expect(passwordEntropy(20, 94)).toBe(131);
    expect(passwordEntropy(32, 94)).toBe(209);
    expect(passwordEntropy(6, 10)).toBe(19);
  });

  it("returns zero for degenerate inputs", () => {
    expect(passwordEntropy(0, 94)).toBe(0);
    expect(passwordEntropy(20, 1)).toBe(0);
  });
});

describe("passphraseEntropy", () => {
  it("matches word count x log2(7776)", () => {
    expect(passphraseEntropy(4)).toBe(51);
    expect(passphraseEntropy(6)).toBe(77);
  });
});

describe("estimateEntropy", () => {
  it("reads the active mode", () => {
    expect(estimateEntropy(state({ mode: "passphrase", wordCount: 6 }))).toBe(77);
    expect(estimateEntropy(state({ mode: "password", length: 20 }))).toBe(131);
  });
});

describe("shouldShowWeakHint", () => {
  it("flags a short custom secret", () => {
    expect(shouldShowWeakHint(state({ preset: "custom", length: 6 }))).toBe(true);
  });

  it("stays quiet for a default-length password", () => {
    expect(shouldShowWeakHint(state())).toBe(false);
  });

  it("never nags the PIN preset", () => {
    const pin = state({ ...presets.pin, preset: "pin" });
    expect(estimateEntropy(pin)).toBeLessThan(weakEntropyThreshold);
    expect(shouldShowWeakHint(pin)).toBe(false);
  });
});
