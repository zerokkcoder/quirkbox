export const cultures = [
  "english",
  "french",
  "spanish",
  "german",
  "italian",
  "portuguese",
  "russian",
  "japanese",
  "korean",
  "chinese-simplified",
  "chinese-traditional",
  "arabic",
  "thai",
  "vietnamese",
] as const;

export const nameGenders = ["any", "feminine", "masculine", "neutral"] as const;

export type Culture = (typeof cultures)[number];
export type NameGender = (typeof nameGenders)[number];
export type ResolvedGender = Exclude<NameGender, "any">;

export type NameFilters = {
  culture: Culture;
  gender: NameGender;
  seed: string;
};

export type NameSuggestion = {
  culture: Culture;
  fullName: string;
  gender: ResolvedGender;
  langCode: string;
};
