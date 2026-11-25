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
      title="Emoji Wallpaper Maker"
      description="Tile emoji into a 4K phone wallpaper with editable sets, arrangements and ratios."
      footer="Browser-only generation with shareable seeds"
      accent="#4A4A8E"
    />,
    size
  );
}
