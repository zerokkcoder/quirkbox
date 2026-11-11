import { notFound } from "next/navigation";
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
import { prefixedLocaleParams } from "@/i18n/routing";
import { assertPrefixedLocale, getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export const instant = false;

export function generateStaticParams() {
  return prefixedLocaleParams;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = assertPrefixedLocale(resolvedParams.locale);

  if (!locale) {
    return {};
  }

  const messages = getMessages(locale);

  return buildMetadata({
    locale,
    title: messages.emojiWallpaper.title,
    description: messages.emojiWallpaper.description,
    pathname: "/tools/emoji-wallpaper",
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const locale = assertPrefixedLocale(resolvedParams.locale);

  if (!locale) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <EmojiWallpaperPage
      locale={locale}
      messages={getMessages(locale)}
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
