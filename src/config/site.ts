export const siteConfig = {
  name: "QuirkBox",
  title: "QuirkBox - Random Name Generator, Pixel Avatar Maker & More Fun Tools",
  description:
    "QuirkBox is a playful generator playground with a random foreign name tool, a pixel avatar maker, and more tiny tools worth sharing.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultLocale: "en",
  locales: ["en", "zh-Hant"] as const,
  nav: [
    { href: "/", key: "home" },
    { href: "/tools", key: "tools" },
    { href: "/about", key: "about" },
  ],
} as const;

export type Locale = (typeof siteConfig.locales)[number];
