import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="page-shell">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link href={localizePath(locale, "/")} className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <SparklesIcon />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight">{siteConfig.name}</span>
              <span className="text-xs text-muted-foreground">Fun generators with room to grow</span>
            </div>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {siteConfig.nav.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
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
