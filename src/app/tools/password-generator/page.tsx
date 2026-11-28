import { connection } from "next/server";
import { PasswordGeneratorPage } from "@/components/sections/password-generator-page";
import { parseGeneratorState } from "@/features/password-generator/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.passwordGenerator.seoTitle,
  description: messages.passwordGenerator.description,
  pathname: "/tools/password-generator",
  keywords: messages.passwordGenerator.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <PasswordGeneratorPage
      locale="en"
      messages={messages}
      initialState={parseGeneratorState(resolvedSearchParams)}
    />
  );
}
