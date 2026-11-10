import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { localizePath } from "@/i18n/navigation";

const routes = ["/", "/tools", "/tools/random-name", "/tools/pixel-avatar", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    siteConfig.locales.map((locale) => ({
      url: new URL(localizePath(locale, route), siteConfig.url).toString(),
      lastModified: new Date(),
    }))
  );
}
