import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { ImageStudioTool } from "@/features/image-studio/components/image-studio-tool";
import type { ImageStudioState } from "@/features/image-studio/lib/types";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function ImageStudioPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: ImageStudioState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/image-converter")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.imageStudio.title}
          title={messages.imageStudio.title}
          description={messages.imageStudio.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/image-converter"
          title={messages.imageStudio.title}
          intro={messages.imageStudio.intro}
          howTo={messages.imageStudio.howTo}
          howToLabel={messages.tools.howToTitle}
        />
        <ImageStudioTool locale={locale} labels={messages.imageStudio} initialState={initialState} />
      </div>
    </SiteShell>
  );
}
