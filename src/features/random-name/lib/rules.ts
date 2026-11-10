import { cultures, nameGenders, type Culture, type NameFilters } from "@/features/random-name/lib/types";

export function normalizeNameFilters(input: Partial<Record<keyof NameFilters, string>>) {
  const culture = cultures.includes(input.culture as Culture) ? (input.culture as Culture) : "english";
  const gender = nameGenders.includes(input.gender as NameFilters["gender"])
    ? (input.gender as NameFilters["gender"])
    : "any";

  return {
    culture,
    gender,
    seed: input.seed && input.seed.length > 0 ? input.seed : "",
  } satisfies NameFilters;
}
