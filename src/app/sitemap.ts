import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { localizePath } from "@/i18n/navigation";

// A fresh Date() on every request makes lastmod change on every crawl and
// Google ends up ignoring it. Bump this constant when published content changes.
const lastModified = new Date("2026-11-26T00:00:00.000Z");

const routes = [
  "/",
  "/tools",
  "/tools/random-name",
  "/tools/pixel-avatar",
  "/tools/emoji-wallpaper",
  "/tools/travel-footprint",
  "/tools/color-palette-generator",
  "/tools/image-converter",
  "/tools/qr-code-generator",
  "/tools/gradient-wallpaper-generator",
  "/about",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    siteConfig.locales.map((locale) => ({
      url: new URL(localizePath(locale, route), siteConfig.url).toString(),
      lastModified,
    }))
  );
}
