import { notFound } from "next/navigation";
import { connection } from "next/server";
import { QrCodeGeneratorPage } from "@/components/sections/qr-code-generator-page";
import { parseQrState } from "@/features/qr-code-generator/lib/settings";
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
    title: messages.qrCodeGenerator.seoTitle,
    description: messages.qrCodeGenerator.description,
    pathname: "/tools/qr-code-generator",
    keywords: messages.qrCodeGenerator.keywords,
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
    <QrCodeGeneratorPage
      locale={locale}
      messages={getMessages(locale)}
      initialState={parseQrState(resolvedSearchParams)}
    />
  );
}
