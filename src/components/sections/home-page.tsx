import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolCard } from "@/components/shared/tool-card";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function HomePage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/")}>
      <div className="flex flex-col gap-10 sm:gap-12">
        <section className="stagger flex max-w-2xl flex-col gap-4">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {siteConfig.name}
          </h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {messages.home.title}
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-11 px-6"
              nativeButton={false}
              render={<Link href={localizePath(locale, "/tools")} />}
            >
              <ArrowRightIcon data-icon="inline-end" />
              {messages.home.primaryCta}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-11 px-5"
              nativeButton={false}
              render={<Link href={localizePath(locale, "/about")} />}
            >
              {messages.home.secondaryCta}
            </Button>
          </div>
        </section>

        <section className="reveal grid gap-5 sm:grid-cols-2">
          <ToolCard
            locale={locale}
            title={messages.tools.randomName.title}
            description={messages.tools.randomName.description}
            href="/tools/random-name"
            badges={[messages.common.shareable]}
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
        </section>
      </div>
    </SiteShell>
  );
}
