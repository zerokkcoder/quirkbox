import { describe, expect, it } from "vitest";
import { QrTooLongError, buildMatrix } from "./matrix";
import { utf8Bytes, utf8Decode } from "./utf8";
import { maxBytesByLevel } from "./types";

describe("qr code generator matrix", () => {
  it("produces a square matrix of dark/light modules", () => {
    const matrix = buildMatrix("https://starrudder.cc", "M");
    expect(matrix.count).toBeGreaterThanOrEqual(21);
    expect(matrix.cells).toHaveLength(matrix.count);
    for (const row of matrix.cells) expect(row).toHaveLength(matrix.count);
    const flat = matrix.cells.flat();
    expect(flat.some(Boolean)).toBe(true);
    expect(flat.some((cell) => !cell)).toBe(true);
  });

  it("encodes Chinese text as UTF-8 bytes, not latin1", () => {
    expect(utf8Bytes("中")).toEqual([0xe4, 0xb8, 0xad]);
    expect(utf8Decode(utf8Bytes("星舵 🚢"))).toBe("星舵 🚢");
    const matrix = buildMatrix("星舵工坊", "M");
    expect(matrix.count).toBeGreaterThan(0);
  });

  it("throws a typed error when content is over capacity", () => {
    const huge = "a".repeat(maxBytesByLevel.H + 1);
    expect(() => buildMatrix(huge, "H")).toThrow(QrTooLongError);
  });

  it("renders different content into different matrices", () => {
    const a = buildMatrix("hello", "M").cells.flat().join("");
    const b = buildMatrix("world", "M").cells.flat().join("");
    expect(a).not.toBe(b);
  });
});
