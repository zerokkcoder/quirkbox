import { notFound } from "next/navigation";
import { connection } from "next/server";
import { JsonToolkitPage } from "@/components/sections/json-toolkit-page";
import { parseToolkitState } from "@/features/json-toolkit/lib/settings";
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
    title: messages.jsonToolkit.seoTitle,
    description: messages.jsonToolkit.description,
    pathname: "/tools/json-toolkit",
    keywords: messages.jsonToolkit.keywords,
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
    <JsonToolkitPage
      locale={locale}
      messages={getMessages(locale)}
      initialState={parseToolkitState(resolvedSearchParams)}
    />
  );
}
