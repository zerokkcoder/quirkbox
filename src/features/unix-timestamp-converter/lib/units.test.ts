import { describe, expect, it } from "vitest";
import { pow10 } from "./bigint";
import {
  detectUnit,
  isWithinDateRange,
  maxMagnitude,
  splitInstant,
  subMillisecondDigits,
  totalNanoseconds,
} from "./units";

describe("detectUnit", () => {
  it("recognises the four magnitude bands", () => {
    expect(detectUnit(1_800_000_000n)).toBe("seconds");
    expect(detectUnit(1_800_000_000_000n)).toBe("milliseconds");
    expect(detectUnit(1_800_000_000_000_000n)).toBe("microseconds");
    expect(detectUnit(1_800_000_000_000_000_000n)).toBe("nanoseconds");
  });

  it("uses the magnitude so negative timestamps are detected too", () => {
    expect(detectUnit(-2_208_988_800n)).toBe("seconds");
  });

  it("refuses values beyond the nanosecond band", () => {
    expect(detectUnit(maxMagnitude)).toBeNull();
    expect(detectUnit(-maxMagnitude)).toBeNull();
  });
});

describe("totalNanoseconds / splitInstant", () => {
  it("converts each unit without losing precision", () => {
    expect(totalNanoseconds(2n, "seconds")).toBe(2_000_000_000n);
    expect(totalNanoseconds(2n, "milliseconds")).toBe(2_000_000n);
    expect(totalNanoseconds(2n, "microseconds")).toBe(2_000n);
    expect(totalNanoseconds(2n, "nanoseconds")).toBe(2n);
  });

  it("keeps the sub-millisecond remainder for microseconds", () => {
    const totalNs = totalNanoseconds(1_234_567n, "microseconds");
    const { epochMs, subMsNs } = splitInstant(totalNs);
    expect(epochMs).toBe(1234n);
    expect(subMsNs).toBe(567_000n);
    expect(subMillisecondDigits(subMsNs)).toBe("567");
  });

  it("floors negative instants instead of truncating toward zero", () => {
    const { epochMs, subMsNs } = splitInstant(-1n);
    expect(epochMs).toBe(-1n);
    expect(subMsNs).toBe(999_999n);
    expect(subMillisecondDigits(subMsNs)).toBe("999999");
  });

  it("trims trailing zeros of the fractional suffix", () => {
    expect(subMillisecondDigits(0n)).toBe("");
    expect(subMillisecondDigits(123_400n)).toBe("1234");
  });
});

describe("isWithinDateRange", () => {
  it("accepts the JS Date boundary and refuses beyond it", () => {
    expect(isWithinDateRange(8_640_000_000_000_000n)).toBe(true);
    expect(isWithinDateRange(-8_640_000_000_000_000n)).toBe(true);
    expect(isWithinDateRange(pow10(16))).toBe(false);
  });
});
