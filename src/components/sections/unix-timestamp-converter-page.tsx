import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { UnixTimestampConverterTool } from "@/features/unix-timestamp-converter/components/unix-timestamp-converter-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function UnixTimestampConverterPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/unix-timestamp-converter")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.unixTimestampConverter.title}
          title={messages.unixTimestampConverter.title}
          description={messages.unixTimestampConverter.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/unix-timestamp-converter"
          title={messages.unixTimestampConverter.title}
          intro={messages.unixTimestampConverter.intro}
          howTo={messages.unixTimestampConverter.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <UnixTimestampConverterTool
          locale={locale}
          labels={messages.unixTimestampConverter}
          shareLabels={messages.share}
        />
      </div>
    </SiteShell>
  );
}
