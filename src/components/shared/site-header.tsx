import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath, stripLocalePrefix } from "@/i18n/navigation";
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
  const currentPath = stripLocalePrefix(pathname);

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
          <div className="hidden items-center gap-1 md:flex">
            {siteConfig.nav.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={currentPath === item.href ? "bg-muted text-foreground" : undefined}
                nativeButton={false}
                render={<Link href={localizePath(locale, item.href)} />}
              >
                {messages.nav[item.key as keyof typeof messages.nav]}
              </Button>
            ))}
          </div>
          <LanguageSwitcher locale={locale} pathname={pathname} label={messages.nav.language} />
        </div>
      </div>
    </header>
  );
}
