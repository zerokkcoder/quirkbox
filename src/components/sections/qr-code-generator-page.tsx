import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { QrCodeGeneratorTool } from "@/features/qr-code-generator/components/qr-code-generator-tool";
import type { QrState } from "@/features/qr-code-generator/lib/types";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function QrCodeGeneratorPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: QrState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/qr-code-generator")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.qrCodeGenerator.title}
          title={messages.qrCodeGenerator.title}
          description={messages.qrCodeGenerator.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/qr-code-generator"
          title={messages.qrCodeGenerator.title}
          intro={messages.qrCodeGenerator.intro}
          howTo={messages.qrCodeGenerator.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <QrCodeGeneratorTool
          locale={locale}
          labels={messages.qrCodeGenerator}
          shareLabels={messages.share}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
