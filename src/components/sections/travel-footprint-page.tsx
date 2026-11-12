import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { TravelFootprintTool } from "@/features/travel-footprint/components/travel-footprint-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function TravelFootprintPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools/travel-footprint")}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.travelFootprint.title}
          title={messages.travelFootprint.title}
          description={messages.travelFootprint.description}
        />
        <TravelFootprintTool locale={locale} labels={messages.travelFootprint} />
      </div>
    </SiteShell>
  );
}
