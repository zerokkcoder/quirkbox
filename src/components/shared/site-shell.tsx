import type { ReactNode } from "react";
import type { Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";
import { LocaleProvider } from "@/components/shared/locale-provider";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export function SiteShell({
  locale,
  messages,
  pathname,
  children,
}: {
  locale: Locale;
  messages: Messages;
  pathname: string;
  children: ReactNode;
}) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <div className="mesh-surface flex min-h-screen flex-col">
        <SiteHeader locale={locale} messages={messages} pathname={pathname} />
        {/* The sticky header is 4rem tall, so sticky tool previews dock just below it. */}
        <main className="page-shell py-10 sm:py-14 [--tool-sticky-top:5rem]">{children}</main>
        <SiteFooter locale={locale} messages={messages} />
      </div>
    </LocaleProvider>
  );
}
