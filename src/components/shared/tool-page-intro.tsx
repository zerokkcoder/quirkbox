import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { absoluteUrl } from "@/lib/seo";

/** Concise how-to block plus crawlable SoftwareApplication structured data. */
export function ToolPageIntro({
  locale,
  pathname,
  title,
  intro,
  howTo,
  howToLabel,
}: {
  locale: Locale;
  pathname: string;
  title: string;
  intro: string;
  howTo: string;
  howToLabel: string;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description: intro,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (browser)",
    url: absoluteUrl(localizePath(locale, pathname)),
    inLanguage: locale === "zh-Hant" ? "zh-Hant" : "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section
        data-testid="tool-how-to"
        aria-labelledby="tool-how-to"
        className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
      >
        <h2 id="tool-how-to" className="text-sm font-semibold tracking-tight text-primary">
          {howToLabel}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{howTo}</p>
      </section>
    </>
  );
}
