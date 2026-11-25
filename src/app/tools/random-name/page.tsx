import { connection } from "next/server";
import { RandomNamePage } from "@/components/sections/random-name-page";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";
import { normalizeNameFilters } from "@/features/random-name/lib/rules";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.randomName.seoTitle,
  description: messages.randomName.description,
  pathname: "/tools/random-name",
  keywords: messages.randomName.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialFilters = normalizeNameFilters({
    culture: typeof resolvedSearchParams.culture === "string" ? resolvedSearchParams.culture : undefined,
    gender: typeof resolvedSearchParams.gender === "string" ? resolvedSearchParams.gender : undefined,
  });
  await connection();
  const serverResult = generateNameSuggestion(initialFilters);

  return <RandomNamePage locale="en" messages={messages} initialFilters={initialFilters} initialResult={serverResult} />;
}
