import { PixelAvatarPage } from "@/components/sections/pixel-avatar-page";
import { getAvatarPalette } from "@/features/pixel-avatar/lib/palettes";
import { createSeed } from "@/features/pixel-avatar/lib/seeds";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.pixelAvatar.title,
  description: messages.pixelAvatar.description,
  pathname: "/tools/pixel-avatar",
  keywords: ["pixel avatar maker", "pixel art avatar generator", "random avatar maker"],
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <PixelAvatarPage
      locale="en"
      messages={messages}
      initialState={{
        seed: typeof resolvedSearchParams.seed === "string" ? resolvedSearchParams.seed : createSeed(10),
        palette:
          typeof resolvedSearchParams.palette === "string"
            ? getAvatarPalette(resolvedSearchParams.palette).id
            : getAvatarPalette().id,
        background:
          typeof resolvedSearchParams.background === "string"
            ? resolvedSearchParams.background
            : "grid",
        size: typeof resolvedSearchParams.size === "string" ? resolvedSearchParams.size : "256",
      }}
    />
  );
}
