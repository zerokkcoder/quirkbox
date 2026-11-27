import { describe, expect, it } from "vitest";
import { formatJson } from "./format";

const compact = '{"b":1,"a":{"z":2,"y":3}}';

describe("formatJson", () => {
  it("indents with two spaces by default", () => {
    const result = formatJson(compact);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe(
      '{\n  "b": 1,\n  "a": {\n    "z": 2,\n    "y": 3\n  }\n}'
    );
    expect(result.charCount).toBe(result.text.length);
  });

  it("uses a literal tab when asked", () => {
    const result = formatJson(compact, { indent: "tab" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe('{\n\t"b": 1,\n\t"a": {\n\t\t"z": 2,\n\t\t"y": 3\n\t}\n}');
  });

  it("sorts object keys recursively", () => {
    const result = formatJson(compact, { indent: "2", sortKeys: true });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe(
      '{\n  "a": {\n    "y": 3,\n    "z": 2\n  },\n  "b": 1\n}'
    );
  });

  it("minifies to valid single-line JSON", () => {
    const result = formatJson(compact, { minify: true });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe(compact);
    expect(JSON.parse(result.text)).toEqual(JSON.parse(compact));
  });

  it("returns a located issue for invalid input", () => {
    const result = formatJson('{\n  "a": 1,\n  x\n}');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issue.line).toBeGreaterThan(0);
    expect(result.issue.message).toContain("JSON");
  });
});
