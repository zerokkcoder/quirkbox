import Link from "next/link";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function SiteFooter({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="page-shell">
        <div className="flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{siteConfig.name}</span>
            <p>{messages.footer.tagline}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href={localizePath(locale, "/tools")} className="hover:text-foreground">
              {messages.nav.tools}
            </Link>
            <Link href={localizePath(locale, "/about")} className="hover:text-foreground">
              {messages.nav.about}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
