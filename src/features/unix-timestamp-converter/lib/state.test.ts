import { describe, expect, it } from "vitest";
import { decodeHash, encodeHash, eventMetadata } from "./state";

describe("hash fragment state (ADR-0002)", () => {
  it("round-trips timestamps and ISO strings", () => {
    const values = [
      "1800000000",
      "-2208988800",
      "2026-01-01T00:00:00+08:00",
      "1800000000000000001",
    ];
    for (const value of values) {
      expect(decodeHash(encodeHash(value))).toBe(value);
    }
  });

  it("produces a fragment, never a query string", () => {
    const encoded = encodeHash("1800000000");
    expect(encoded).toBe("#v=1800000000");
    expect(encoded.startsWith("#")).toBe(true);
    expect(encoded).not.toContain("?");
    expect(encodeHash("  ")).toBe("");
  });

  it("ignores unrelated or malformed fragments", () => {
    expect(decodeHash("")).toBe("");
    expect(decodeHash("#foo=bar")).toBe("");
    expect(decodeHash("#v=")).toBe("");
    expect(decodeHash("#v=1800000000&other=1")).toBe("1800000000");
  });

  it("encodes characters that would otherwise break a URL", () => {
    const encoded = encodeHash("2026-01-01T00:00:00+08:00");
    expect(encoded).toContain("%3A");
    expect(encoded).toContain("%2B");
  });
});

describe("analytics metadata whitelist", () => {
  it("never carries the input value", () => {
    const input = "SUPER-SECRET-LOG-LINE-42";
    const metadata = eventMetadata("auto", "Asia/Taipei");
    expect(Object.keys(metadata).sort()).toEqual(["tool", "unit", "zone"]);
    expect(JSON.stringify(metadata)).not.toContain(input);
    expect(metadata.tool).toBe("unix-timestamp-converter");
  });
});
