import { connection } from "next/server";
import { PaletteStudioPage } from "@/components/sections/palette-studio-page";
import { parsePaletteState } from "@/features/palette-studio/lib/presets";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.paletteStudio.seoTitle,
  description: messages.paletteStudio.description,
  pathname: "/tools/color-palette-generator",
  keywords: messages.paletteStudio.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <PaletteStudioPage
      locale="en"
      messages={messages}
      initialState={parsePaletteState(resolvedSearchParams)}
    />
  );
}
