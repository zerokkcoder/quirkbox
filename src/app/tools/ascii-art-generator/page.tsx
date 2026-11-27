import { connection } from "next/server";
import { AsciiArtGeneratorPage } from "@/components/sections/ascii-art-generator-page";
import { parseAsciiState } from "@/features/ascii-art-generator/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.asciiArt.seoTitle,
  description: messages.asciiArt.description,
  pathname: "/tools/ascii-art-generator",
  keywords: messages.asciiArt.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <AsciiArtGeneratorPage
      locale="en"
      messages={messages}
      initialState={parseAsciiState(resolvedSearchParams)}
    />
  );
}
