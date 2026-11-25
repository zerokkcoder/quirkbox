import { ImageResponse } from "next/og";
import { OGCard } from "@/components/shared/og-card";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <OGCard
      title="Tools that stay in your browser."
      description="Free tools for names, avatars, color palettes, emoji wallpapers and travel maps. No account, no uploads, no data saved."
      footer="Free browser tools · starrudder.cc"
      accent="#3B5FA8"
    />,
    size
  );
}
