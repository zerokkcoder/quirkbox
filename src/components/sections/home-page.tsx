import { Desktop } from "@/components/desktop/desktop";
import { siteConfig, type Locale } from "@/config/site";
import type { Messages } from "@/lib/i18n";

export function HomePage({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <>
      <h1 className="sr-only">
        {siteConfig.name} — {messages.home.title}
      </h1>
      <Desktop locale={locale} messages={messages} />
    </>
  );
}
