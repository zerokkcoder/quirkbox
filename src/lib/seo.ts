import type { Metadata } from "next";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";

type MetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  pathname: string;
  keywords?: string[];
};

export function absoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

export function buildMetadata({
  locale,
  title,
  description,
  pathname,
  keywords = [],
}: MetadataInput): Metadata {
  const canonical = localizePath(locale, pathname);
  const zhAlternate = localizePath("zh-Hant", pathname);

  return {
    title: title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        en: pathname,
        "zh-Hant": zhAlternate,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: siteConfig.name,
      locale: locale === "zh-Hant" ? "zh_TW" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
