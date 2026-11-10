import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function AboutPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/about")}>
      <PageHeader
        eyebrow={messages.nav.about}
        title={messages.about.title}
        description={messages.about.description}
      />
    </SiteShell>
  );
}
