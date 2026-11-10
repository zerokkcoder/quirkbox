const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

export function createSeed(length = 10) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function hashSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: string) {
  let value = hashSeed(seed) || 1;

  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    return ((value >>> 0) % 10_000) / 10_000;
  };
}
