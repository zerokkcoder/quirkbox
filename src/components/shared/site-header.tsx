import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function SiteHeader({
  locale,
  messages,
  pathname,
}: {
  locale: Locale;
  messages: Messages;
  pathname: string;
}) {
  return (
    <header className="header-scroll sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="page-shell">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href={localizePath(locale, "/")}
            className="flex items-center gap-3 text-foreground hover:text-primary"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SparklesIcon className="size-5" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
          <LanguageSwitcher locale={locale} pathname={pathname} label={messages.nav.language} />
        </div>
      </div>
    </header>
  );
}
