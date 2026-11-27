import { describe, expect, it } from "vitest";
import { asciiToText, renderAscii, sanitizeText } from "./render";
import { maxTextLength } from "./types";

describe("ascii art renderer", () => {
  it("renders a deterministic headline for the same input", () => {
    const input = { text: "HELLO", font: "standard" as const, gap: 1, align: "left" as const };
    const first = asciiToText(renderAscii(input));
    const second = asciiToText(renderAscii(input));
    expect(first).toBe(second);
    expect(first).toContain("#");
    expect(first.split("\n").length).toBe(7);
  });

  it("uppercases input and replaces unsupported characters with `?`", () => {
    const sanitized = sanitizeText("Hi 中文!");
    expect(sanitized.safe).toBe("HI ???!");
    expect(sanitized.unsupported).toEqual(["中", "文"]);

    const result = renderAscii({ text: "Hi 中文!", font: "standard", gap: 1, align: "left" });
    expect(result.hasUnsupported).toBe(true);
    expect(result.unsupported).toEqual(["中", "文"]);
  });

  it("truncates input at the documented limit", () => {
    const long = "A".repeat(maxTextLength + 12);
    expect(sanitizeText(long).safe).toHaveLength(maxTextLength);
  });

  it("returns no lines for empty input", () => {
    const result = renderAscii({ text: "", font: "standard", gap: 1, align: "left" });
    expect(result.lines).toEqual([]);
    expect(result.width).toBe(0);
  });

  it("widens the output as gap increases", () => {
    const narrow = renderAscii({ text: "HI", font: "standard", gap: 0, align: "left" });
    const wide = renderAscii({ text: "HI", font: "standard", gap: 3, align: "left" });
    expect(wide.width).toBeGreaterThan(narrow.width);
  });

  it("pads lines for center and right alignment without changing glyph width", () => {
    const input = { text: "I", font: "standard" as const, gap: 1 };
    const left = renderAscii({ ...input, align: "left" });
    const center = renderAscii({ ...input, align: "center" });
    const right = renderAscii({ ...input, align: "right" });
    expect(left.width).toBe(center.width);
    expect(center.lines[0].startsWith(" ")).toBe(true);
    expect(right.lines[0].startsWith(" ")).toBe(true);
    expect(right.lines[0].trimStart()).toBe(left.lines[0].trimStart());
  });

  it("right-trims every line so copied text has no dead spaces", () => {
    const result = renderAscii({ text: "T", font: "standard", gap: 1, align: "left" });
    for (const line of result.lines) expect(line).toBe(line.replace(/\s+$/, ""));
  });

  it("produces different art for different fonts", () => {
    const standard = asciiToText(renderAscii({ text: "A", font: "standard", gap: 1, align: "left" }));
    const big = asciiToText(renderAscii({ text: "A", font: "big", gap: 1, align: "left" }));
    expect(big).not.toBe(standard);
  });

  it("supports TAAG-style vertical spacing and horizontal flip", () => {
    const input = { text: "A", font: "standard" as const, gap: 1, align: "left" as const };
    const plain = renderAscii(input);
    const spaced = renderAscii({ ...input, vGap: 2 });
    expect(spaced.lines).toHaveLength(plain.lines.length + (plain.lines.length - 1) * 2);

    const flipped = renderAscii({ ...input, flip: true });
    expect(flipped.lines[0]).not.toBe(plain.lines[0]);
    expect(flipped.lines[0]).toContain("#");
  });
});
