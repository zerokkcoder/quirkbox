import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import HomeFaqEn from "@/content/landing/home-faq.en.mdx";
import HomeFaqZhHant from "@/content/landing/home-faq.zh-Hant.mdx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolCard } from "@/components/shared/tool-card";
import { siteConfig, type Locale } from "@/config/site";
import { themeConfig } from "@/config/theme";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

const faqByLocale = {
  en: HomeFaqEn,
  "zh-Hant": HomeFaqZhHant,
} as const;

export function HomePage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const FaqContent = faqByLocale[locale];

  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/")}>
      <section className={`pixel-grid overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br ${themeConfig.gradients.hero}`}>
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit gap-2">
              <SparklesIcon />
              {messages.home.eyebrow}
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                {messages.home.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {messages.home.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href={localizePath(locale, "/tools")} />}>
                  <ArrowRightIcon data-icon="inline-end" />
                  {messages.home.primaryCta}
              </Button>
              <Button
                variant="outline"
                size="lg"
                render={<Link href={localizePath(locale, "/about")} />}
              >
                {messages.home.secondaryCta}
              </Button>
            </div>
          </div>
          <Card className="bg-background/85">
            <CardHeader>
              <CardTitle>{siteConfig.name}</CardTitle>
              <CardDescription>{messages.site.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {messages.home.stats.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{messages.home.featuredTitle}</h2>
          <p className="text-muted-foreground">{messages.home.featuredDescription}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ToolCard
            locale={locale}
            title={messages.tools.randomName.title}
            description={messages.tools.randomName.description}
            href="/tools/random-name"
            badges={[messages.common.shareable, "SEO-ready"]}
            actionLabel={messages.common.openTool}
          />
          <ToolCard
            locale={locale}
            title={messages.tools.pixelAvatar.title}
            description={messages.tools.pixelAvatar.description}
            href="/tools/pixel-avatar"
            badges={[messages.common.browserOnly, messages.common.shareable]}
            actionLabel={messages.common.openTool}
          />
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{messages.home.faqTitle}</CardTitle>
            <CardDescription>{messages.home.faqDescription}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <FaqContent />
          </CardContent>
        </Card>
      </section>

      <Separator className="my-10" />
    </SiteShell>
  );
}
