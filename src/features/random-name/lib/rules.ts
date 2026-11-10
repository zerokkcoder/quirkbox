import englishNames from "@/features/random-name/data/names/english.json";
import frenchNames from "@/features/random-name/data/names/french.json";
import japaneseNames from "@/features/random-name/data/names/japanese.json";
import koreanNames from "@/features/random-name/data/names/korean.json";
import {
  cultures,
  nameGenders,
  nameVibes,
  type Culture,
  type NameFilters,
  type NameRecord,
} from "@/features/random-name/lib/types";

export const namesByCulture: Record<Culture, NameRecord[]> = {
  english: englishNames as NameRecord[],
  french: frenchNames as NameRecord[],
  japanese: japaneseNames as NameRecord[],
  korean: koreanNames as NameRecord[],
};

export const cultureLabels: Record<Culture, string> = {
  english: "English",
  french: "French",
  japanese: "Japanese",
  korean: "Korean",
};

export function normalizeNameFilters(input: Partial<Record<keyof NameFilters, string>>) {
  const culture = cultures.includes(input.culture as Culture)
    ? (input.culture as Culture)
    : "english";
  const gender = nameGenders.includes(input.gender as (typeof nameGenders)[number])
    ? (input.gender as NameFilters["gender"])
    : "any";
  const vibe = nameVibes.includes(input.vibe as (typeof nameVibes)[number])
    ? (input.vibe as NameFilters["vibe"])
    : "playful";

  return {
    culture,
    gender,
    vibe,
    includeMeaning: input.includeMeaning === "true",
    seed: input.seed && input.seed.length > 0 ? input.seed : "",
  } satisfies Omit<NameFilters, "seed"> & { seed: string };
}
