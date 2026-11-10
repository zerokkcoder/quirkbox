import { SiteShell } from "@/components/shared/site-shell";
import { ToolCard } from "@/components/shared/tool-card";
import { PageHeader } from "@/components/shared/page-header";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function ToolsPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools")}>
      <div className="flex flex-col gap-10">
        <PageHeader eyebrow={messages.nav.tools} title={messages.tools.title} />
        <div className="reveal grid gap-5 sm:grid-cols-2">
          <ToolCard
            locale={locale}
            title={messages.tools.randomName.title}
            description={messages.tools.randomName.description}
            href="/tools/random-name"
            badges={[messages.common.shareable]}
            actionLabel={messages.common.openTool}
          />
          <ToolCard
            locale={locale}
            title={messages.tools.pixelAvatar.title}
            description={messages.tools.pixelAvatar.description}
            href="/tools/pixel-avatar"
            badges={[messages.common.browserOnly, messages.common.shareable]}
            actionLabel={messages.common.openTool}
          />
        </div>
      </div>
    </SiteShell>
  );
}
