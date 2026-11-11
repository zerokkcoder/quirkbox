import { connection } from "next/server";
import { EmojiWallpaperPage } from "@/components/sections/emoji-wallpaper-page";
import { normalizeEmojiTheme } from "@/features/emoji-wallpaper/lib/emoji-sets";
import { normalizeWallpaperPaletteId } from "@/features/emoji-wallpaper/lib/palettes";
import {
  defaultEmojiFormat,
  normalizeEmojiColumns,
  normalizeEmojiPattern,
  normalizeEmojiTone,
} from "@/features/emoji-wallpaper/lib/patterns";
import { normalizeWallpaperRatio } from "@/features/emoji-wallpaper/lib/ratios";
import { createSeed } from "@/lib/seeds";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.emojiWallpaper.title,
  description: messages.emojiWallpaper.description,
  pathname: "/tools/emoji-wallpaper",
  keywords: ["emoji wallpaper maker", "emoji pattern wallpaper generator", "phone emoji wallpaper builder"],
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <EmojiWallpaperPage
      locale="en"
      messages={messages}
      initialState={{
        seed: typeof resolvedSearchParams.seed === "string" ? resolvedSearchParams.seed : createSeed(10),
        theme: normalizeEmojiTheme(
          typeof resolvedSearchParams.theme === "string" ? resolvedSearchParams.theme : undefined
        ),
        emoji: typeof resolvedSearchParams.emoji === "string" ? resolvedSearchParams.emoji : "",
        pattern: normalizeEmojiPattern(
          typeof resolvedSearchParams.pattern === "string" ? resolvedSearchParams.pattern : undefined
        ),
        ratio: normalizeWallpaperRatio(
          typeof resolvedSearchParams.ratio === "string" ? resolvedSearchParams.ratio : undefined
        ),
        columns: normalizeEmojiColumns(
          typeof resolvedSearchParams.columns === "string" ? resolvedSearchParams.columns : undefined
        ),
        palette: normalizeWallpaperPaletteId(
          typeof resolvedSearchParams.palette === "string" ? resolvedSearchParams.palette : undefined
        ),
        tone: normalizeEmojiTone(
          typeof resolvedSearchParams.tone === "string" ? resolvedSearchParams.tone : undefined
        ),
        format: defaultEmojiFormat,
      }}
    />
  );
}
