export const siteConfig = {
  name: "StarRudder",
  nameZh: "星舵工坊",
  title: "StarRudder — Free Browser Tools, No Signup",
  description:
    "Free tools that run entirely in your browser. Generate names, avatars, color palettes, emoji wallpapers and travel maps — nothing uploaded, nothing stored.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://starrudder.cc",
  defaultLocale: "en",
  locales: ["en", "zh-Hant"] as const,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
