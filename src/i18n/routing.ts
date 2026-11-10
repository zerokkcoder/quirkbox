import { siteConfig, type Locale } from "@/config/site";

export const locales = siteConfig.locales;
export const defaultLocale = siteConfig.defaultLocale;
export const localizedLocales = locales.filter(
  (locale) => locale !== defaultLocale
) as Exclude<Locale, typeof defaultLocale>[];
export const prefixedLocaleParams = localizedLocales.map((locale) => ({ locale }));

export function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isPrefixedLocale(
  value: string
): value is Exclude<Locale, typeof defaultLocale> {
  return localizedLocales.includes(value as Exclude<Locale, typeof defaultLocale>);
}
