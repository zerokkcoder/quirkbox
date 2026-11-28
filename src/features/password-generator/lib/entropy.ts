import { buildCharset } from "./charset";
import { clampLength, clampWordCount, type GeneratorState } from "./types";
import { WORDLIST_SIZE } from "./wordlist";

/**
 * Below roughly this many bits, a guessable secret becomes a realistic risk.
 * It sits between four words (~51.7 bits) and six words (~77.5 bits).
 */
export const weakEntropyThreshold = 60;

export function passwordEntropy(length: number, size: number): number {
  if (length <= 0 || size <= 1) return 0;
  return Math.floor(length * Math.log2(size));
}

export function passphraseEntropy(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.floor(wordCount * Math.log2(WORDLIST_SIZE));
}

/**
 * Deterministic arithmetic, not a heuristic score: length × log2(pool size), or
 * word count × log2(7776). With "minimum per type" enabled the true entropy is
 * marginally lower, which the How-it-works copy states.
 */
export function estimateEntropy(state: GeneratorState): number {
  if (state.mode === "passphrase") {
    return passphraseEntropy(clampWordCount(state.wordCount));
  }
  return passwordEntropy(clampLength(state.length), buildCharset(state).length);
}

/** Six digits is the point of the PIN scenario, so it is never nagged about. */
export function shouldShowWeakHint(state: GeneratorState): boolean {
  if (state.preset === "pin") return false;
  return estimateEntropy(state) < weakEntropyThreshold;
}
