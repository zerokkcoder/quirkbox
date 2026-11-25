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
      title="Pixel Avatar Maker"
      description="Deterministic pixel portraits, palette controls, and one-click PNG export."
      footer="Browser-only generation with shareable seeds"
      accent="#3E5C9E"
    />,
    size
  );
}
