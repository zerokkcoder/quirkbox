import { describe, expect, it } from "vitest";
import {
  codeSnippets,
  dayOfYear,
  formatZoned,
  fractionalDigits,
  isoString,
  isoWeek,
  relativeText,
  rfc1123,
  sqlString,
  unitValue,
  utcHuman,
  weekday,
} from "./format";
import { interpretInput } from "./parse";

function view(input: string) {
  const result = interpretInput(input);
  if (!result.ok) {
    throw new Error(`fixture failed: ${input}`);
  }
  return result.view;
}

describe("UTC representations", () => {
  it("renders ISO 8601 with trailing .000 omitted", () => {
    const value = view("1800000000000");
    expect(isoString(value)).toBe(
      new Date(1_800_000_000_000).toISOString().replace(".000Z", "Z")
    );
    expect(utcHuman(value)).toContain(" UTC");
    expect(sqlString(value)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(rfc1123(value)).toContain("GMT");
  });

  it("keeps nanosecond precision in the ISO suffix", () => {
    const value = view("2026-01-01T00:00:00.123456789Z");
    expect(fractionalDigits(value)).toBe("123456789");
    expect(isoString(value)).toBe("2026-01-01T00:00:00.123456789Z");
  });
});

describe("integer units", () => {
  it("derives every unit from totalNs without precision loss", () => {
    const value = view("1800000000000000001");
    expect(unitValue(value, "seconds")).toBe(1_800_000_000n);
    expect(unitValue(value, "milliseconds")).toBe(1_800_000_000_000n);
    expect(unitValue(value, "microseconds")).toBe(1_800_000_000_000_000n);
    expect(unitValue(value, "nanoseconds")).toBe(1_800_000_000_000_000_001n);
  });

  it("floors negative seconds instead of truncating toward zero", () => {
    expect(unitValue(view("-1"), "seconds")).toBe(-1n);
    const nanos = interpretInput("-1", "nanoseconds");
    if (!nanos.ok) {
      throw new Error("nanosecond fixture failed");
    }
    expect(unitValue(nanos.view, "seconds")).toBe(-1n);
  });
});

describe("time zone formatting", () => {
  it("produces the same clock in UTC and the correct offset for Taipei", () => {
    const value = view("1800000000000");
    const utc = formatZoned(value, "UTC", "en");
    const taipei = formatZoned(value, "Asia/Taipei", "en");
    expect(utc.text).toBe(utcHuman(value).replace(" UTC", ""));
    expect(utc.offset).toContain("GMT");
    expect(taipei.offset).toContain("+8");
    expect(taipei.text).not.toBe(utc.text);
    expect(isoString(value)).toBe(
      new Date(1_800_000_000_000).toISOString().replace(".000Z", "Z")
    );
  });

  it("lets Intl handle DST boundaries", () => {
    const summer = view("2026-07-01T12:00:00Z");
    const winter = view("2026-01-01T12:00:00Z");
    expect(formatZoned(summer, "America/New_York", "en").offset).not.toBe(
      formatZoned(winter, "America/New_York", "en").offset
    );
  });
});

describe("secondary formats", () => {
  it("localises relative time and calendar metadata", () => {
    const value = view("1800000000000");
    expect(relativeText(value, Number(value.epochMs), "en")).toMatch(/now/i);
    expect(relativeText(value, Number(value.epochMs) - 3_600_000, "en")).toMatch(/hour/i);
    expect(weekday(value, "en")).not.toBe("");
    expect(isoWeek(value)).toBeGreaterThanOrEqual(1);
    expect(isoWeek(value)).toBeLessThanOrEqual(53);
    expect(dayOfYear(value)).toBeGreaterThanOrEqual(1);
    expect(dayOfYear(value)).toBeLessThanOrEqual(366);
  });

  it("builds static code snippets from the integer values", () => {
    const snippets = codeSnippets(view("1800000000000"));
    expect(snippets).toHaveLength(5);
    expect(snippets.map((snippet) => snippet.language)).toContain("JavaScript");
    expect(snippets.every((snippet) => snippet.code.includes("1800000000"))).toBe(true);
  });
});
