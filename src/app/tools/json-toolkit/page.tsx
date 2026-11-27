import { connection } from "next/server";
import { JsonToolkitPage } from "@/components/sections/json-toolkit-page";
import { parseToolkitState } from "@/features/json-toolkit/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.jsonToolkit.seoTitle,
  description: messages.jsonToolkit.description,
  pathname: "/tools/json-toolkit",
  keywords: messages.jsonToolkit.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <JsonToolkitPage
      locale="en"
      messages={messages}
      initialState={parseToolkitState(resolvedSearchParams)}
    />
  );
}
