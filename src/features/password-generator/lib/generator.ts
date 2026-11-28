import { buildCharset, enabledPools } from "./charset";
import { randomIndex, shuffle } from "./random";
import {
  clampBatch,
  clampLength,
  clampMinPerType,
  clampWordCount,
  type GeneratorState,
} from "./types";
import { WORDLIST, WORDLIST_SIZE } from "./wordlist";

export class EmptyCharsetError extends Error {
  constructor() {
    super("charset-empty");
    this.name = "EmptyCharsetError";
  }
}

function drawFrom(pool: string, count: number): string[] {
  const chars: string[] = [];
  for (let i = 0; i < count; i += 1) {
    chars.push(pool[randomIndex(pool.length)]);
  }
  return chars;
}

/**
 * A custom charset has no notion of "types", so minimum-per-type is ignored
 * there. When it is active, every enabled pool contributes `minPerType` chars,
 * the rest is filled from the combined pool, then the whole string is shuffled
 * so the guaranteed prefix cannot be predicted.
 */
export function generatePassword(state: GeneratorState): string {
  const charset = buildCharset(state);
  if (charset.length === 0) {
    throw new EmptyCharsetError();
  }

  const length = clampLength(state.length);
  const minPerType = clampMinPerType(state.minPerType);

  if (state.customCharset.length > 0 || minPerType === 0) {
    return drawFrom(charset, length).join("");
  }

  const pools = enabledPools(state);
  const perType = Math.min(minPerType, Math.floor(length / pools.length));
  const chars: string[] = [];

  pools.forEach((pool) => {
    chars.push(...drawFrom(pool, perType));
  });

  while (chars.length < length) {
    chars.push(charset[randomIndex(charset.length)]);
  }

  return shuffle(chars).join("");
}

function separatorFor(state: GeneratorState): string {
  switch (state.separator) {
    case "space":
      return " ";
    case "dot":
      return ".";
    case "none":
      return "";
    case "custom":
      return state.customSeparator || "-";
    case "dash":
    default:
      return "-";
  }
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generatePassphrase(state: GeneratorState): string {
  const count = clampWordCount(state.wordCount);
  const words: string[] = [];

  for (let i = 0; i < count; i += 1) {
    words.push(WORDLIST[randomIndex(WORDLIST_SIZE)]);
  }

  const rendered = state.capitalize ? words.map(capitalise) : words;
  let phrase = rendered.join(separatorFor(state));

  if (state.appendNumber) {
    phrase += String(randomIndex(10));
  }

  return phrase;
}

export function generateSecret(state: GeneratorState): string {
  return state.mode === "passphrase" ? generatePassphrase(state) : generatePassword(state);
}

export function generateBatch(state: GeneratorState): string[] {
  return Array.from({ length: clampBatch(state.batch) }, () => generateSecret(state));
}
