import { describe, expect, it } from "vitest";
import { delimitedToJson, jsonToDelimited } from "./csv";

describe("jsonToDelimited", () => {
  it("serializes nested values and unions headers", () => {
    const input = '[{"name":"A","tags":["x","y"],"meta":{"city":"X"}},{"name":"B","tags":[],"meta":null}]';

    const result = jsonToDelimited(input, "csv");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe(
      'name,tags,meta\nA,"[""x"",""y""]","{""city"":""X""}"\nB,[],'
    );
  });

  it("uses a tab delimiter for TSV and quotes tabs inside cells", () => {
    const result = jsonToDelimited('[{"a":1,"b":"x\\ty"}]', "tsv");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.text).toBe('a\tb\n1\t"x\ty"');
  });

  it("rejects input that is not an array of objects", () => {
    expect(jsonToDelimited('"just a string"', "csv").ok).toBe(false);
    expect(jsonToDelimited("[1,2,3]", "csv").ok).toBe(false);
  });
});

describe("delimitedToJson", () => {
  it("parses quoted cells, embedded newlines and doubled quotes", () => {
    const result = delimitedToJson('name,note\nA,"line1\nline2"\nB,"say ""hi"""', "csv");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.parse(result.text)).toEqual([
      { name: "A", note: "line1\nline2" },
      { name: "B", note: 'say "hi"' },
    ]);
  });

  it("keeps every cell as a string without type inference", () => {
    const result = delimitedToJson("code,active\n007,true\n", "csv");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.parse(result.text)).toEqual([{ code: "007", active: "true" }]);
  });

  it("fills missing cells with empty strings and strips a BOM", () => {
    const result = delimitedToJson('\ufeffa,b\n1,\n,2', "csv");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.parse(result.text)).toEqual([
      { a: "1", b: "" },
      { a: "", b: "2" },
    ]);
  });
});
