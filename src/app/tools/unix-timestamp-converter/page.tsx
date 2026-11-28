import { connection } from "next/server";
import { UnixTimestampConverterPage } from "@/components/sections/unix-timestamp-converter-page";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.unixTimestampConverter.seoTitle,
  description: messages.unixTimestampConverter.description,
  pathname: "/tools/unix-timestamp-converter",
  keywords: messages.unixTimestampConverter.keywords,
});

/**
 * No searchParams: the input is a URL fragment (ADR-0002), which the server
 * never receives. `connection()` keeps the page out of the static shell, as for
 * the other tool routes.
 */
export default async function Page() {
  await connection();

  return <UnixTimestampConverterPage locale="en" messages={messages} />;
}
