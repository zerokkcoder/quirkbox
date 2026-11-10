import { defaultLocale, isSupportedLocale } from "@/i18n/routing";
import type { Locale } from "@/config/site";

export function localizePath(locale: Locale, pathname: string) {
  if (locale === defaultLocale) {
    return pathname;
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const [firstSegment, ...rest] = segments;

  if (!firstSegment || !isSupportedLocale(firstSegment)) {
    return pathname === "" ? "/" : pathname;
  }

  return rest.length === 0 ? "/" : `/${rest.join("/")}`;
}
