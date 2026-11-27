import { describe, expect, it } from "vitest";
import { defaultToolkitState, type ToolkitState } from "./types";
import { parseToolkitState, stateToParams } from "./settings";

const nonDefault: ToolkitState = {
  tab: "convert",
  indent: "4",
  sortKeys: true,
  direction: "to-json",
  delimiter: "tsv",
};

describe("stateToParams", () => {
  it("omits defaults so a fresh visit keeps a clean URL", () => {
    expect(stateToParams(defaultToolkitState)).toEqual({
      tab: undefined,
      indent: undefined,
      sort: undefined,
      direction: undefined,
      delimiter: undefined,
    });
  });

  it("serializes every non-default setting", () => {
    expect(stateToParams(nonDefault)).toEqual({
      tab: "convert",
      indent: "4",
      sort: "1",
      direction: "to-json",
      delimiter: "tsv",
    });
  });

  it("never serializes input data, only known setting keys", () => {
    const params = stateToParams(nonDefault);
    const allowed = ["tab", "indent", "sort", "direction", "delimiter"];

    expect(Object.keys(params).every((key) => allowed.includes(key))).toBe(true);
    expect(JSON.stringify(params)).not.toContain("secret");
  });
});

describe("parseToolkitState", () => {
  it("round-trips from URLSearchParams", () => {
    const params = new URLSearchParams([
      ["tab", "convert"],
      ["indent", "4"],
      ["sort", "1"],
      ["direction", "to-json"],
      ["delimiter", "tsv"],
    ]);

    expect(parseToolkitState(params)).toEqual(nonDefault);
  });

  it("reads RSC-style record values", () => {
    expect(parseToolkitState({ tab: ["convert"], indent: "tab" })).toEqual({
      ...defaultToolkitState,
      tab: "convert",
      indent: "tab",
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(
      parseToolkitState({
        tab: "bogus",
        indent: "9",
        sort: "yes",
        direction: "up",
        delimiter: "pipe",
      })
    ).toEqual(defaultToolkitState);
  });
});
