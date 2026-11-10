import { notFound } from "next/navigation";
import { RandomNamePage } from "@/components/sections/random-name-page";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";
import { normalizeNameFilters } from "@/features/random-name/lib/rules";
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
    title: messages.randomName.title,
    description: messages.randomName.description,
    pathname: "/tools/random-name",
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
  const initialFilters = {
    ...normalizeNameFilters({
      culture: typeof resolvedSearchParams.culture === "string" ? resolvedSearchParams.culture : undefined,
      gender: typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined,
      vibe: typeof resolvedSearchParams.vibe === "string" ? resolvedSearchParams.vibe : undefined,
      includeMeaning:
        typeof resolvedSearchParams.includeMeaning === "string"
          ? resolvedSearchParams.includeMeaning
          : undefined,
      seed: typeof resolvedSearchParams.seed === "string" ? resolvedSearchParams.seed : undefined,
    }),
  };
  const initialResult = generateNameSuggestion({
    ...initialFilters,
    includeMeaning: String(initialFilters.includeMeaning),
  });

  return (
    <RandomNamePage
      locale={locale}
      messages={getMessages(locale)}
      initialFilters={initialFilters}
      initialResult={initialResult}
    />
  );
}
