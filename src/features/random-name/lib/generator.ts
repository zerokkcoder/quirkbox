import { faker as fakerAR } from "@faker-js/faker/locale/ar";
import { faker as fakerDE } from "@faker-js/faker/locale/de";
import { faker as fakerEN } from "@faker-js/faker/locale/en";
import { faker as fakerES } from "@faker-js/faker/locale/es";
import { faker as fakerFR } from "@faker-js/faker/locale/fr";
import { faker as fakerIT } from "@faker-js/faker/locale/it";
import { faker as fakerJA } from "@faker-js/faker/locale/ja";
import { faker as fakerKO } from "@faker-js/faker/locale/ko";
import { faker as fakerPT_BR } from "@faker-js/faker/locale/pt_BR";
import { faker as fakerRU } from "@faker-js/faker/locale/ru";
import { faker as fakerTH } from "@faker-js/faker/locale/th";
import { faker as fakerVI } from "@faker-js/faker/locale/vi";
import { faker as fakerZH_CN } from "@faker-js/faker/locale/zh_CN";
import { faker as fakerZH_TW } from "@faker-js/faker/locale/zh_TW";
import { createSeed, hashSeed } from "@/features/pixel-avatar/lib/seeds";
import { normalizeNameFilters } from "@/features/random-name/lib/rules";
import type {
  Culture,
  NameFilters,
  NameGender,
  NameSuggestion,
  ResolvedGender,
} from "@/features/random-name/lib/types";

type FakerInstance = typeof fakerEN;
type FakerSex = NonNullable<Parameters<FakerInstance["person"]["firstName"]>[0]>;

const fakersByCulture: Record<Culture, FakerInstance> = {
  english: fakerEN,
  french: fakerFR,
  spanish: fakerES,
  german: fakerDE,
  italian: fakerIT,
  portuguese: fakerPT_BR,
  russian: fakerRU,
  japanese: fakerJA,
  korean: fakerKO,
  "chinese-simplified": fakerZH_CN,
  "chinese-traditional": fakerZH_TW,
  arabic: fakerAR,
  thai: fakerTH,
  vietnamese: fakerVI,
};

const langCodeByCulture: Record<Culture, string> = {
  english: "en-US",
  french: "fr-FR",
  spanish: "es-ES",
  german: "de-DE",
  italian: "it-IT",
  portuguese: "pt-BR",
  russian: "ru-RU",
  japanese: "ja-JP",
  korean: "ko-KR",
  "chinese-simplified": "zh-CN",
  "chinese-traditional": "zh-TW",
  arabic: "ar-SA",
  thai: "th-TH",
  vietnamese: "vi-VN",
};

const genderBySex: Record<FakerSex, ResolvedGender> = {
  female: "feminine",
  male: "masculine",
  generic: "neutral",
};

function resolveSex(faker: FakerInstance, gender: NameGender): FakerSex {
  switch (gender) {
    case "feminine":
      return "female";
    case "masculine":
      return "male";
    // "any" and "neutral" both draw from the male/female pools. Faker's "generic"
    // pool is too small for some locales (Japanese has a single entry).
    default:
      return faker.helpers.arrayElement<FakerSex>(["female", "male"]);
  }
}

function formatFullName(culture: Culture, firstName: string, lastName: string) {
  switch (culture) {
    case "japanese":
      return `${lastName} ${firstName}`;
    case "korean":
    case "chinese-simplified":
    case "chinese-traditional":
      return `${lastName}${firstName}`;
    default:
      return `${firstName} ${lastName}`;
  }
}

export function generateNameSuggestion(rawFilters: Partial<Record<keyof NameFilters, string>>): NameSuggestion {
  const normalized = normalizeNameFilters(rawFilters);
  const seed = normalized.seed || createSeed(8);
  const culture = normalized.culture;
  const faker = fakersByCulture[culture];

  faker.seed(hashSeed(seed));

  const sex = resolveSex(faker, normalized.gender);

  return {
    culture,
    fullName: formatFullName(culture, faker.person.firstName(sex), faker.person.lastName(sex)),
    gender: genderBySex[sex],
    langCode: langCodeByCulture[culture],
  };
}
