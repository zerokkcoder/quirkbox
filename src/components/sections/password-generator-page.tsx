import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { PasswordGeneratorTool } from "@/features/password-generator/components/password-generator-tool";
import type { GeneratorState } from "@/features/password-generator/lib/types";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function PasswordGeneratorPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: GeneratorState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/password-generator")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.passwordGenerator.title}
          title={messages.passwordGenerator.title}
          description={messages.passwordGenerator.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/password-generator"
          title={messages.passwordGenerator.title}
          intro={messages.passwordGenerator.intro}
          howTo={messages.passwordGenerator.howTo}
          howToLabel={messages.tools.howToTitle}
        />
        <PasswordGeneratorTool
          locale={locale}
          labels={messages.passwordGenerator}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
