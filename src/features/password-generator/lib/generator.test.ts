import { describe, expect, it } from "vitest";
import { buildCharset } from "./charset";
import {
  EmptyCharsetError,
  generateBatch,
  generatePassphrase,
  generatePassword,
  generateSecret,
} from "./generator";
import { defaultState, presets, type GeneratorState } from "./types";
import { WORDLIST } from "./wordlist";

function state(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return { ...defaultState, ...overrides };
}

describe("generatePassword", () => {
  it("returns exactly the requested length", () => {
    expect(generatePassword(state({ length: 32 }))).toHaveLength(32);
  });

  it("only draws characters from the active charset", () => {
    const charset = buildCharset(state());
    for (const char of generatePassword(state({ length: 64 }))) {
      expect(charset).toContain(char);
    }
  });

  it("honours minimum-per-type after the shuffle", () => {
    const secret = generatePassword(state({ length: 20, minPerType: 2 }));
    expect(/[A-Z]/.test(secret)).toBe(true);
    expect(/[a-z]/.test(secret)).toBe(true);
    expect(/[0-9]/.test(secret)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(secret)).toBe(true);
  });

  it("clamps minimum-per-type when the length cannot fit it", () => {
    const secret = generatePassword(state({ length: 8, minPerType: 4 }));
    expect(secret).toHaveLength(8);
  });

  it("produces different secrets on consecutive calls", () => {
    expect(generatePassword(state({ length: 32 }))).not.toBe(
      generatePassword(state({ length: 32 }))
    );
  });

  it("throws when every pool is disabled", () => {
    expect(() =>
      generatePassword(
        state({ uppercase: false, lowercase: false, digits: false, symbols: false })
      )
    ).toThrow(EmptyCharsetError);
  });

  it("keeps the PIN preset numeric", () => {
    const pin = state({ ...presets.pin, preset: "pin" });
    expect(generatePassword(pin)).toMatch(/^[0-9]{6}$/);
  });
});

describe("generatePassphrase", () => {
  it("returns the requested number of words", () => {
    const phrase = generatePassphrase(state({ mode: "passphrase", wordCount: 6 }));
    expect(phrase.split("-")).toHaveLength(6);
  });

  it("uses only words from the EFF list", () => {
    const phrase = generatePassphrase(state({ mode: "passphrase", wordCount: 6 }));
    for (const word of phrase.split("-")) {
      expect(WORDLIST).toContain(word);
    }
  });

  it("applies separator, capitalisation and trailing number", () => {
    const phrase = generatePassphrase(
      state({
        mode: "passphrase",
        wordCount: 4,
        separator: "space",
        capitalize: true,
        appendNumber: true,
      })
    );
    const parts = phrase.split(" ");

    expect(parts).toHaveLength(4);
    for (const part of parts) {
      expect(part.charAt(0)).toBe(part.charAt(0).toUpperCase());
    }
    expect(parts[3]).toMatch(/[0-9]$/);
  });

  it("can join without a separator", () => {
    const phrase = generatePassphrase(
      state({ mode: "passphrase", wordCount: 4, separator: "none" })
    );
    expect(phrase).toMatch(/^[a-z-]+$/);
  });

  it("falls back to a dash when a custom separator is empty", () => {
    const phrase = generatePassphrase(
      state({ mode: "passphrase", wordCount: 4, separator: "custom", customSeparator: "" })
    );
    expect(phrase.split("-")).toHaveLength(4);
  });
});

describe("generateSecret", () => {
  it("dispatches on the mode", () => {
    expect(generateSecret(state({ mode: "passphrase", wordCount: 4 })).split("-")).toHaveLength(4);
    expect(generateSecret(state({ mode: "password", length: 12 }))).toHaveLength(12);
  });
});

describe("generateBatch", () => {
  it("returns the requested batch size with distinct secrets", () => {
    const batch = generateBatch(state({ batch: 5, length: 32 }));
    expect(batch).toHaveLength(5);
    expect(new Set(batch).size).toBe(5);
  });
});
