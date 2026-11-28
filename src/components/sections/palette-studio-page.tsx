import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { PaletteStudioTool } from "@/features/palette-studio/components/palette-studio-tool";
import type { PaletteState } from "@/features/palette-studio/lib/types";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function PaletteStudioPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: PaletteState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/color-palette-generator")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.paletteStudio.title}
          title={messages.paletteStudio.title}
          description={messages.paletteStudio.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/color-palette-generator"
          title={messages.paletteStudio.title}
          intro={messages.paletteStudio.intro}
          howTo={messages.paletteStudio.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <PaletteStudioTool
          locale={locale}
          labels={messages.paletteStudio}
          shareLabels={messages.share}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
