import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { RandomNameTool } from "@/features/random-name/components/random-name-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";
import type { NameFilters, NameSuggestion } from "@/features/random-name/lib/types";

export function RandomNamePage({
  locale,
  messages,
  initialFilters,
  initialResult,
}: {
  locale: Locale;
  messages: Messages;
  initialFilters: NameFilters;
  initialResult: NameSuggestion;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools/random-name")}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.randomName.title}
          title={messages.randomName.title}
          description={messages.randomName.description}
        />
        <RandomNameTool labels={messages.randomName} initialFilters={initialFilters} initialResult={initialResult} />
      </div>
    </SiteShell>
  );
}
