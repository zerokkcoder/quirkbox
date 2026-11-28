import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
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
          description={messages.randomName.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/random-name"
          title={messages.randomName.title}
          intro={messages.randomName.intro}
          howTo={messages.randomName.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <RandomNameTool
          locale={locale}
          labels={messages.randomName}
          shareLabels={messages.share}
          initialFilters={initialFilters}
          initialResult={initialResult}
        />
      </div>
    </SiteShell>
  );
}
