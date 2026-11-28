import type { faker as fakerEN } from "@faker-js/faker/locale/en";
import { createSeed, hashSeed } from "@/lib/seeds";
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

// Load only the locale the request actually needs. Importing all 14 at startup
// costs memory and slows cold starts for a tool that usually uses one culture.
const localeLoaders: Record<Culture, () => Promise<{ faker: FakerInstance }>> = {
  english: () => import("@faker-js/faker/locale/en"),
  french: () => import("@faker-js/faker/locale/fr"),
  spanish: () => import("@faker-js/faker/locale/es"),
  german: () => import("@faker-js/faker/locale/de"),
  italian: () => import("@faker-js/faker/locale/it"),
  portuguese: () => import("@faker-js/faker/locale/pt_BR"),
  russian: () => import("@faker-js/faker/locale/ru"),
  japanese: () => import("@faker-js/faker/locale/ja"),
  korean: () => import("@faker-js/faker/locale/ko"),
  "chinese-simplified": () => import("@faker-js/faker/locale/zh_CN"),
  "chinese-traditional": () => import("@faker-js/faker/locale/zh_TW"),
  arabic: () => import("@faker-js/faker/locale/ar"),
  thai: () => import("@faker-js/faker/locale/th"),
  vietnamese: () => import("@faker-js/faker/locale/vi"),
};

const fakerCache = new Map<Culture, FakerInstance>();

async function getFaker(culture: Culture): Promise<FakerInstance> {
  const cached = fakerCache.get(culture);
  if (cached) return cached;
  const loaded = await localeLoaders[culture]();
  fakerCache.set(culture, loaded.faker);
  return loaded.faker;
}

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

export async function generateNameSuggestion(
  rawFilters: Partial<Record<keyof NameFilters, string>>
): Promise<NameSuggestion> {
  const normalized = normalizeNameFilters(rawFilters);
  const seed = normalized.seed || createSeed(8);
  const culture = normalized.culture;
  const faker = await getFaker(culture);

  faker.seed(hashSeed(seed));

  const sex = resolveSex(faker, normalized.gender);

  return {
    culture,
    fullName: formatFullName(culture, faker.person.firstName(sex), faker.person.lastName(sex)),
    gender: genderBySex[sex],
    langCode: langCodeByCulture[culture],
  };
}
