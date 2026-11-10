import type { ReactNode } from "react";
import type { Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";

export function LocaleProvider({
  locale: _locale,
  messages: _messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  void [_locale, _messages];
  return <>{children}</>;
}
