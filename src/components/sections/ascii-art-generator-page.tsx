import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import {
  AsciiArtGeneratorTool,
  type AsciiState,
} from "@/features/ascii-art-generator/components/ascii-art-generator-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function AsciiArtGeneratorPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: AsciiState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/ascii-art-generator")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.asciiArt.title}
          title={messages.asciiArt.title}
          description={messages.asciiArt.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/ascii-art-generator"
          title={messages.asciiArt.title}
          intro={messages.asciiArt.intro}
          howTo={messages.asciiArt.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <AsciiArtGeneratorTool
          locale={locale}
          labels={messages.asciiArt}
          shareLabels={messages.share}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
