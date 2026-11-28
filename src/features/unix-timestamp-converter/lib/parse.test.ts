import { describe, expect, it } from "vitest";
import { unitValue } from "./format";
import { interpretInput } from "./parse";

function okView(input: string, unit: Parameters<typeof interpretInput>[1] = "auto") {
  const result = interpretInput(input, unit);
  if (!result.ok) {
    throw new Error(`expected ${input} to parse, got ${result.code}`);
  }
  return result.view;
}

describe("integer input", () => {
  it("detects seconds and builds an exact Date", () => {
    const view = okView("1800000000");
    expect(view.source).toBe("timestamp");
    expect(view.unit).toBe("seconds");
    expect(view.detected).toBe(true);
    expect(view.originalValue).toBe(1_800_000_000n);
    expect(view.date.getTime()).toBe(1_800_000_000_000);
    expect(unitValue(view, "seconds")).toBe(1_800_000_000n);
  });

  it("detects milliseconds, microseconds and nanoseconds", () => {
    expect(okView("1800000000000").unit).toBe("milliseconds");
    expect(okView("1800000000000000").unit).toBe("microseconds");
    const ns = okView("1800000000000000001");
    expect(ns.unit).toBe("nanoseconds");
    expect(ns.subMsNs).toBe(1n);
    expect(unitValue(ns, "nanoseconds")).toBe(1_800_000_000_000_000_001n);
  });

  it("lets the user override the detected unit", () => {
    const view = okView("1800000000", "milliseconds");
    expect(view.unit).toBe("milliseconds");
    expect(view.detected).toBe(false);
    expect(view.date.getTime()).toBe(1_800_000_000);
  });

  it("handles negative timestamps and floor-divides the seconds value", () => {
    const view = okView("-2208988800");
    expect(view.date.getTime()).toBe(-2_208_988_800_000);
    expect(unitValue(view, "seconds")).toBe(-2_208_988_800n);
  });
});

describe("offset-bearing ISO input", () => {
  it("parses Z and numeric offsets into their own instants", () => {
    const utc = okView("2026-01-01T00:00:00Z");
    const plusEight = okView("2026-01-01T00:00:00+08:00");
    expect(utc.source).toBe("date");
    expect(utc.date.getTime()).toBe(Date.UTC(2026, 0, 1));
    expect(plusEight.date.getTime()).toBe(Date.UTC(2025, 11, 31, 16));
    expect(unitValue(utc, "seconds") - unitValue(plusEight, "seconds")).toBe(28_800n);
  });

  it("preserves sub-millisecond fractional digits", () => {
    const view = okView("2026-01-01T00:00:00.123456789Z");
    expect(view.subMsNs).toBe(456_789n);
    expect(view.date.getTime()).toBe(Date.UTC(2026, 0, 1) + 123);
  });

  it("accepts a minute-precision ISO string", () => {
    expect(okView("2026-01-01T12:30Z").date.getTime()).toBe(
      Date.UTC(2026, 0, 1, 12, 30)
    );
  });
});

describe("strict rejection (Q13)", () => {
  it("rejects wall-clock strings without an offset", () => {
    expect(interpretInput("2026-01-01 09:00:00")).toEqual({
      ok: false,
      code: "invalid",
    });
    expect(interpretInput("2026-01-01")).toEqual({ ok: false, code: "invalid" });
    expect(interpretInput("2026-01-01T09:00:00")).toEqual({
      ok: false,
      code: "invalid",
    });
  });

  it("rejects ambiguous numeric dates and free text", () => {
    expect(interpretInput("01/02/2026")).toEqual({ ok: false, code: "invalid" });
    expect(interpretInput("yesterday")).toEqual({ ok: false, code: "invalid" });
    expect(interpretInput("12abc")).toEqual({ ok: false, code: "invalid" });
  });

  it("reports empty input separately", () => {
    expect(interpretInput("   ")).toEqual({ ok: false, code: "empty" });
  });

  it("rejects impossible calendar and offset values", () => {
    expect(interpretInput("2026-13-01T00:00:00Z")).toEqual({
      ok: false,
      code: "invalid",
    });
    expect(interpretInput("2026-01-01T00:00:00+25:00")).toEqual({
      ok: false,
      code: "invalid",
    });
  });

  it("refuses values beyond the detection bands or the Date range", () => {
    expect(interpretInput("100000000000000000000")).toEqual({
      ok: false,
      code: "outOfRange",
    });
    expect(interpretInput("1000000000000000000000", "seconds")).toEqual({
      ok: false,
      code: "outOfRange",
    });
  });
});
