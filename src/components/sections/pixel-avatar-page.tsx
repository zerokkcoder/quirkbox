import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import { PixelAvatarTool } from "@/features/pixel-avatar/components/pixel-avatar-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function PixelAvatarPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: {
    seed: string;
    style: string;
    palette: string;
  };
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools/pixel-avatar")}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.pixelAvatar.title}
          title={messages.pixelAvatar.title}
          description={messages.pixelAvatar.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/pixel-avatar"
          title={messages.pixelAvatar.title}
          intro={messages.pixelAvatar.intro}
          howTo={messages.pixelAvatar.howTo}
          howToLabel={messages.tools.howToTitle}
          supportLabels={messages.support}
        />
        <PixelAvatarTool
          locale={locale}
          labels={messages.pixelAvatar}
          shareLabels={messages.share}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
