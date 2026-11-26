import { connection } from "next/server";
import { GradientWallpaperGeneratorPage } from "@/components/sections/gradient-wallpaper-generator-page";
import { parseGradientState, type ParamSource } from "@/features/gradient-wallpaper-generator/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.gradientWallpaper.seoTitle,
  description: messages.gradientWallpaper.description,
  pathname: "/tools/gradient-wallpaper-generator",
  keywords: messages.gradientWallpaper.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <GradientWallpaperGeneratorPage
      locale="en"
      messages={messages}
      initialState={parseGradientState(resolvedSearchParams as ParamSource)}
    />
  );
}
