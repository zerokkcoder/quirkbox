import { describe, expect, it } from "vitest";
import { usesQrPayment } from "./region";

describe("support payment region", () => {
  it("uses QR codes for the Chinese locale regardless of country", () => {
    expect(usesQrPayment("zh-Hant", null)).toBe(true);
    expect(usesQrPayment("zh-Hant", "US")).toBe(true);
  });

  it("uses QR codes for Chinese regions on an English UI", () => {
    expect(usesQrPayment("en", "CN")).toBe(true);
    expect(usesQrPayment("en", "HK")).toBe(true);
    expect(usesQrPayment("en", "MO")).toBe(true);
  });

  it("falls back to Ko-fi elsewhere", () => {
    expect(usesQrPayment("en", null)).toBe(false);
    expect(usesQrPayment("en", "US")).toBe(false);
  });
});
