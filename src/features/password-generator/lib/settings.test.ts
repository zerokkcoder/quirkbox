import { describe, expect, it } from "vitest";
import { parseGeneratorState, stateToParams } from "./settings";
import { defaultState, presets, type GeneratorState } from "./types";

function state(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return { ...defaultState, ...overrides };
}

describe("parseGeneratorState", () => {
  it("returns the defaults for an empty source", () => {
    expect(parseGeneratorState({})).toEqual(defaultState);
  });

  it("round-trips a fully customised state", () => {
    const custom = state({
      preset: "custom",
      length: 42,
      uppercase: false,
      minPerType: 2,
      excludeAmbiguous: true,
      customCharset: "",
      wordCount: 9,
      separator: "space",
      capitalize: true,
      appendNumber: true,
      batch: 3,
    });

    expect(parseGeneratorState(stateToParams(custom))).toEqual(custom);
  });

  it("uses preset parameters when the URL only names the preset", () => {
    expect(parseGeneratorState({ p: "strong" }).length).toBe(32);
    expect(parseGeneratorState({ p: "memorable" }).mode).toBe("passphrase");
    expect(parseGeneratorState({ p: "pin" }).length).toBe(6);
  });

  it("clamps out-of-range values and ignores unknown ones", () => {
    const parsed = parseGeneratorState({
      len: "999",
      words: "1",
      batch: "99",
      min: "99",
      p: "nope",
      sep: "nope",
    });

    expect(parsed.length).toBe(128);
    expect(parsed.wordCount).toBe(4);
    expect(parsed.batch).toBe(10);
    expect(parsed.minPerType).toBe(4);
    expect(parsed.preset).toBe("account");
    expect(parsed.separator).toBe(defaultState.separator);
  });

  it("accepts both URLSearchParams and plain records", () => {
    const params = new URLSearchParams({ p: "memorable", words: "8" });
    expect(parseGeneratorState(params)).toEqual(parseGeneratorState({ p: "memorable", words: "8" }));
    expect(parseGeneratorState(params).wordCount).toBe(8);
  });
});

describe("stateToParams", () => {
  it("omits every default so a shared URL stays short", () => {
    const values = Object.values(stateToParams(defaultState));
    expect(values.every((value) => value === undefined)).toBe(true);
  });

  it("never serialises a generated secret", () => {
    const values = Object.values(stateToParams(state({ preset: "custom", batch: 10 })))
      .filter(Boolean)
      .join(" ");

    expect(values).not.toMatch(/[A-Za-z0-9]{16,}/);
  });

  it("round-trips preset names", () => {
    expect(stateToParams(state({ ...presets.strong, preset: "strong" })).p).toBe("strong");
  });
});
