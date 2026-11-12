import { describe, expect, it } from "vitest";
import {
  getLineColor,
  getLineStyle,
  hexToRgb,
  lineColorOptions,
  lineStyleOptions,
  normalizeLineWidth,
  resolveLineStyle,
  toAnimationId,
} from "@/features/travel-footprint/lib/line-styles";
import {
  lineColorIds,
  lineStyleIds,
  type LineColorId,
  type LineStyleId,
} from "@/features/travel-footprint/lib/types";

describe("lineColorOptions", () => {
  it("uses hex literals for every preset", () => {
    for (const option of lineColorOptions) {
      expect(option.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("covers every line color id exactly once", () => {
    expect(lineColorOptions.map((option) => option.id)).toEqual([...lineColorIds]);
  });
});

describe("lineStyleOptions", () => {
  it("covers every line style id exactly once", () => {
    expect(lineStyleOptions.map((option) => option.id)).toEqual([...lineStyleIds]);
  });

  it("leaves the solid line without a dash array", () => {
    expect(getLineStyle("solid").dashArray).toBeUndefined();
  });
});

describe("getLineStyle / getLineColor", () => {
  it("resolves every style id", () => {
    for (const id of lineStyleIds) {
      expect(getLineStyle(id).id).toBe(id);
    }
  });

  it("resolves every color id", () => {
    for (const id of lineColorIds) {
      expect(getLineColor(id).id).toBe(id);
    }
  });

  it("falls back to the first preset for an unknown id", () => {
    expect(getLineStyle("nope" as LineStyleId)).toBe(lineStyleOptions[0]);
    expect(getLineColor("nope" as LineColorId)).toBe(lineColorOptions[0]);
  });
});

describe("resolved style", () => {
  it("keeps the WebGL layer and PNG export in sync", () => {
    const resolved = resolveLineStyle({ lineStyle: "dashed", lineColor: "coral", lineWidth: 5 });

    expect(resolved).toMatchObject({
      color: "#e11d48",
      width: 5,
      dashArray: [4, 3],
      lineCap: "butt",
    });
  });

  it("clamps widths to the slider range", () => {
    expect(normalizeLineWidth(999)).toBe(8);
    expect(normalizeLineWidth(-3)).toBe(1);
    expect(normalizeLineWidth(Number.NaN)).toBe(3);
    expect(normalizeLineWidth("4")).toBe(3);
  });

  it("converts hex colors and guards enums", () => {
    expect(hexToRgb("#2563eb")).toEqual([37, 99, 235]);
    expect(toAnimationId("comet")).toBe("comet");
    expect(toAnimationId("teleport")).toBeNull();
  });
});
