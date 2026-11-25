import { describe, expect, it } from "vitest";
import { crc32, createZip } from "./zip";

const encoder = new TextEncoder();
const fixedDate = new Date("2026-11-26T00:00:00.000Z");

function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function findSequence(bytes: Uint8Array, pattern: number[]) {
  outer: for (let i = 0; i <= bytes.length - pattern.length; i += 1) {
    for (let j = 0; j < pattern.length; j += 1) {
      if (bytes[i + j] !== pattern[j]) continue outer;
    }
    return i;
  }
  return -1;
}

describe("store-only ZIP", () => {
  it("computes the standard CRC32 checksum", () => {
    expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("writes local headers, a central directory and an end record", () => {
    const zip = createZip(
      [
        { name: "first.txt", data: encoder.encode("hello") },
        { name: "second.txt", data: encoder.encode("world") },
      ],
      fixedDate
    );
    const data = view(zip);

    expect(data.getUint32(0, true)).toBe(0x04034b50);
    expect(data.getUint16(6, true) & 0x0800).toBe(0x0800); // UTF-8 names
    expect(data.getUint16(8, true)).toBe(0); // no compression
    expect(new TextDecoder().decode(zip.slice(30, 39))).toBe("first.txt");

    const central = findSequence(zip, [0x50, 0x4b, 0x01, 0x02]);
    expect(central).toBeGreaterThan(0);
    expect(data.getUint32(central, true)).toBe(0x02014b50);
    expect(data.getUint16(central + 10, true)).toBe(0);

    const end = findSequence(zip, [0x50, 0x4b, 0x05, 0x06]);
    expect(end).toBeGreaterThan(central);
    expect(data.getUint16(end + 10, true)).toBe(2);
  });

  it("keeps payload bytes intact", () => {
    const payload = encoder.encode("starrudder");
    const zip = createZip([{ name: "payload.txt", data: payload }], fixedDate);
    const start = 30 + "payload.txt".length;
    // Compare plain number arrays: jsdom's TextEncoder returns bytes from another
    // realm, so `toEqual` on the typed arrays would fail on the prototype alone.
    expect(Array.from(zip.slice(start, start + payload.length))).toEqual(Array.from(payload));
  });
});
