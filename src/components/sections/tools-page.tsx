import { DicesIcon, Grid2x2Icon } from "lucide-react";
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
        <div className="reveal grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          <ToolCard
            locale={locale}
            icon={<DicesIcon />}
            title={messages.tools.randomName.title}
            href="/tools/random-name"
          />
          <ToolCard
            locale={locale}
            icon={<Grid2x2Icon />}
            title={messages.tools.pixelAvatar.title}
            href="/tools/pixel-avatar"
          />
        </div>
      </div>
    </SiteShell>
  );
}
