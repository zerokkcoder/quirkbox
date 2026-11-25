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
      title="Travel Footprint"
      description="Plot home and visited places, then draw and export your routes."
      footer="No signup · runs in your browser"
      accent="#2C608E"
    />,
    size
  );
}
