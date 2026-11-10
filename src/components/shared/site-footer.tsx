import Link from "next/link";
import { SparklesIcon } from "lucide-react";
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
    <footer className="mt-8 border-t border-border/60">
      <div className="page-shell">
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SparklesIcon className="size-3.5" />
            </span>
            <span className="font-heading text-sm font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href={localizePath(locale, "/tools")}
              className="text-muted-foreground hover:text-foreground"
            >
              {messages.nav.tools}
            </Link>
            <Link
              href={localizePath(locale, "/about")}
              className="text-muted-foreground hover:text-foreground"
            >
              {messages.nav.about}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
