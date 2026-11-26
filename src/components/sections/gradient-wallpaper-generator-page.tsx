import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolPageIntro } from "@/components/shared/tool-page-intro";
import {
  GradientWallpaperGeneratorTool,
  type GradientState,
} from "@/features/gradient-wallpaper-generator/components/gradient-wallpaper-generator-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function GradientWallpaperGeneratorPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: GradientState;
}) {
  return (
    <SiteShell
      locale={locale}
      messages={messages}
      pathname={localizePath(locale, "/tools/gradient-wallpaper-generator")}
    >
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.gradientWallpaper.title}
          title={messages.gradientWallpaper.title}
          description={messages.gradientWallpaper.intro}
        />
        <ToolPageIntro
          locale={locale}
          pathname="/tools/gradient-wallpaper-generator"
          title={messages.gradientWallpaper.title}
          intro={messages.gradientWallpaper.intro}
          howTo={messages.gradientWallpaper.howTo}
          howToLabel={messages.tools.howToTitle}
        />
        <GradientWallpaperGeneratorTool
          locale={locale}
          labels={messages.gradientWallpaper}
          initialState={initialState}
        />
      </div>
    </SiteShell>
  );
}
