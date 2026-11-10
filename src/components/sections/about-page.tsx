import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

const principles = [
  "Ship playful tools as dedicated, indexable pages.",
  "Favor deterministic logic before paid AI dependencies.",
  "Keep every generator easy to share, revisit, and expand.",
];

export function AboutPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/about")}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.nav.about}
          title={messages.about.title}
          description={messages.about.description}
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{messages.about.principlesTitle}</CardTitle>
              <CardDescription>
                The first version is optimized for speed, personality, and future tool expansion.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {principles.map((principle) => (
                <div key={principle} className="rounded-2xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  {principle}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Roadmap
              </Badge>
              <CardTitle>What comes next</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>More generators, richer landing pages, localized content, and stronger social previews.</p>
              <p>The current architecture already leaves room for more feature directories and standalone tool routes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
