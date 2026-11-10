import enMessages from "../../messages/en.json";
import zhHantMessages from "../../messages/zh-Hant.json";
import { defaultLocale, isPrefixedLocale, isSupportedLocale } from "@/i18n/routing";
import type { Locale } from "@/config/site";

export type Messages = typeof enMessages;

export function getMessages(locale: Locale): Messages {
  return locale === "zh-Hant" ? zhHantMessages : enMessages;
}

export function resolveLocale(locale?: string): Locale {
  if (locale && isSupportedLocale(locale)) {
    return locale;
  }

  return defaultLocale;
}

export function assertPrefixedLocale(locale: string) {
  return isPrefixedLocale(locale) ? locale : null;
}
