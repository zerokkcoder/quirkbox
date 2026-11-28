import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import type { Locale } from "@/config/site";
import { TokenCostCalculatorTool } from "@/features/token-cost-calculator/components/token-cost-calculator-tool";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

const path = "/tools/token-cost-calculator";

export function TokenCostCalculatorPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, path)}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.tokenCostCalculator.title}
          title={messages.tokenCostCalculator.title}
          description={messages.tokenCostCalculator.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname={path}
          title={messages.tokenCostCalculator.title}
          intro={messages.tokenCostCalculator.intro}
          howTo={messages.tokenCostCalculator.howTo}
          howToLabel={messages.tools.howToTitle}
        />
        <TokenCostCalculatorTool locale={locale} labels={messages.tokenCostCalculator} />
      </div>
    </SiteShell>
  );
}
