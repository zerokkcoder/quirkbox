import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import {
  JsonToolkitTool,
  type ToolkitState,
} from "@/features/json-toolkit/components/json-toolkit-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function JsonToolkitPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: ToolkitState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/json-toolkit")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.jsonToolkit.title}
          title={messages.jsonToolkit.title}
          description={messages.jsonToolkit.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/json-toolkit"
          title={messages.jsonToolkit.title}
          intro={messages.jsonToolkit.intro}
          howTo={messages.jsonToolkit.howTo}
          howToLabel={messages.tools.howToTitle}
        />
        <JsonToolkitTool
          locale={locale}
          labels={messages.jsonToolkit}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
