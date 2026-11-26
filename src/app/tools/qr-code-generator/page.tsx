import { connection } from "next/server";
import { QrCodeGeneratorPage } from "@/components/sections/qr-code-generator-page";
import { parseQrState } from "@/features/qr-code-generator/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.qrCodeGenerator.seoTitle,
  description: messages.qrCodeGenerator.description,
  pathname: "/tools/qr-code-generator",
  keywords: messages.qrCodeGenerator.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <QrCodeGeneratorPage
      locale="en"
      messages={messages}
      initialState={parseQrState(resolvedSearchParams)}
    />
  );
}
