import { PageHeader } from "@/components/shared/page-header";
import { SiteShell } from "@/components/shared/site-shell";
import { EmojiWallpaperTool, type EmojiWallpaperState } from "@/features/emoji-wallpaper/components/emoji-wallpaper-tool";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

export function EmojiWallpaperPage({
  locale,
  messages,
  initialState,
}: {
  locale: Locale;
  messages: Messages;
  initialState: EmojiWallpaperState;
}) {
  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools/emoji-wallpaper")}>
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={messages.tools.emojiWallpaper.title}
          title={messages.emojiWallpaper.title}
          description={messages.emojiWallpaper.description}
        />
        <EmojiWallpaperTool locale={locale} labels={messages.emojiWallpaper} initialState={initialState} />
      </div>
    </SiteShell>
  );
}
