import { createSeed, createSeededRandom } from "@/features/pixel-avatar/lib/seeds";
import { cultureLabels, namesByCulture, normalizeNameFilters } from "@/features/random-name/lib/rules";
import type { NameFilters, NameRecord, NameSuggestion } from "@/features/random-name/lib/types";

function scoreRecord(record: NameRecord, filters: NameFilters) {
  let score = 1;

  if (filters.gender === "any" || record.gender === filters.gender) {
    score += 3;
  }

  if (record.vibes.includes(filters.vibe)) {
    score += 4;
  }

  return score;
}

function buildReason(record: NameRecord, filters: NameFilters) {
  const culture = cultureLabels[filters.culture];
  const vibePhrase = `${filters.vibe} ${culture.toLowerCase()} feel`;

  return `${record.name} matches the ${vibePhrase} you selected and keeps a ${record.gender} leaning that fits the request.`;
}

export function generateNameSuggestion(rawFilters: Partial<Record<keyof NameFilters, string>>): NameSuggestion {
  const normalized = normalizeNameFilters(rawFilters);
  const seed = normalized.seed || createSeed(8);
  const filters: NameFilters = { ...normalized, seed };
  const candidates = namesByCulture[filters.culture];
  const rng = createSeededRandom(seed);
  const weighted = candidates.flatMap((record) =>
    Array.from({ length: scoreRecord(record, filters) }, () => record)
  );
  const selected = weighted[Math.floor(rng() * weighted.length)] ?? candidates[0];

  return {
    seed,
    culture: filters.culture,
    name: selected.name,
    meaning: filters.includeMeaning ? selected.meaning : undefined,
    pronunciation: selected.pronunciation,
    reason: buildReason(selected, filters),
    vibe: filters.vibe,
    gender: filters.gender,
  };
}
