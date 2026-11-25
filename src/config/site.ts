export const siteConfig = {
  name: "StarRudder",
  nameZh: "星舵工坊",
  title: "StarRudder — Small tools for the journey",
  description:
    "StarRudder is a workshop of browser-sized tools: generate a name, draw an avatar, compose a wallpaper, or chart a route — then share where you landed.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://starrudder.cc",
  defaultLocale: "en",
  locales: ["en", "zh-Hant"] as const,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
