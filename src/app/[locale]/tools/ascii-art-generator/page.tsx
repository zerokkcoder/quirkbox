import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AsciiArtGeneratorPage } from "@/components/sections/ascii-art-generator-page";
import { parseAsciiState } from "@/features/ascii-art-generator/lib/settings";
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
    title: messages.asciiArt.seoTitle,
    description: messages.asciiArt.description,
    pathname: "/tools/ascii-art-generator",
    keywords: messages.asciiArt.keywords,
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
    <AsciiArtGeneratorPage
      locale={locale}
      messages={getMessages(locale)}
      initialState={parseAsciiState(resolvedSearchParams)}
    />
  );
}
