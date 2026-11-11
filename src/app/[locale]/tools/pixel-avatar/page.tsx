import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PixelAvatarPage } from "@/components/sections/pixel-avatar-page";
import { defaultAvatarStyle, normalizeAvatarStyle } from "@/features/pixel-avatar/lib/generate-avatar";
import { getAvatarPalette } from "@/features/pixel-avatar/lib/palettes";
import { createSeed } from "@/lib/seeds";
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
    title: messages.pixelAvatar.title,
    description: messages.pixelAvatar.description,
    pathname: "/tools/pixel-avatar",
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
    <PixelAvatarPage
      locale={locale}
      messages={getMessages(locale)}
      initialState={{
        seed: typeof resolvedSearchParams.seed === "string" ? resolvedSearchParams.seed : createSeed(10),
        palette:
          typeof resolvedSearchParams.palette === "string"
            ? getAvatarPalette(resolvedSearchParams.palette).id
            : getAvatarPalette().id,
        style: normalizeAvatarStyle(
          typeof resolvedSearchParams.style === "string" ? resolvedSearchParams.style : defaultAvatarStyle
        ),
      }}
    />
  );
}
