import { connection } from "next/server";
import { ImageStudioPage } from "@/components/sections/image-studio-page";
import { parseImageStudioState } from "@/features/image-studio/lib/settings";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.imageStudio.seoTitle,
  description: messages.imageStudio.description,
  pathname: "/tools/image-studio",
  keywords: messages.imageStudio.keywords,
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await connection();

  return (
    <ImageStudioPage
      locale="en"
      messages={messages}
      initialState={parseImageStudioState(resolvedSearchParams)}
    />
  );
}
