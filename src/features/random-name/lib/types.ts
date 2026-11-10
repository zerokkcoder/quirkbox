export const cultures = ["english", "french", "japanese", "korean"] as const;
export const nameGenders = ["any", "feminine", "masculine", "neutral"] as const;
export const nameVibes = ["formal", "playful", "bold", "soft"] as const;

export type Culture = (typeof cultures)[number];
export type NameGender = (typeof nameGenders)[number];
export type NameVibe = (typeof nameVibes)[number];

export type NameRecord = {
  name: string;
  gender: Exclude<NameGender, "any">;
  vibes: NameVibe[];
  meaning: string;
  pronunciation: string;
};

export type NameFilters = {
  culture: Culture;
  gender: NameGender;
  vibe: NameVibe;
  includeMeaning: boolean;
  seed: string;
};

export type NameSuggestion = {
  seed: string;
  culture: Culture;
  name: string;
  meaning?: string;
  pronunciation: string;
  reason: string;
  vibe: NameVibe;
  gender: NameGender;
};
