import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { cn } from "@/lib/utils";

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
              <BrandMark size={22} />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
          <nav aria-label={messages.nav.main} className="ms-auto flex items-center gap-1 text-sm">
            {[
              { href: "/tools", label: messages.nav.tools },
              { href: "/about", label: messages.nav.about },
            ].map((item) => {
              const href = localizePath(locale, item.href);
              const active = pathname === href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <LanguageSwitcher locale={locale} pathname={pathname} label={messages.nav.language} />
        </div>
      </div>
    </header>
  );
}
