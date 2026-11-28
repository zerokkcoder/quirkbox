import { notFound } from "next/navigation";
import { connection } from "next/server";
import { UnixTimestampConverterPage } from "@/components/sections/unix-timestamp-converter-page";
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
    title: messages.unixTimestampConverter.seoTitle,
    description: messages.unixTimestampConverter.description,
    pathname: "/tools/unix-timestamp-converter",
    keywords: messages.unixTimestampConverter.keywords,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = assertPrefixedLocale(resolvedParams.locale);

  if (!locale) {
    notFound();
  }

  await connection();

  return (
    <UnixTimestampConverterPage locale={locale} messages={getMessages(locale)} />
  );
}
