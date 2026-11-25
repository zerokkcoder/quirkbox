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
      description="Drop a home, add every place you have been, and draw your own routes."
      footer="Custom lines · auto-fit view · PNG & data export"
      accent="#2C608E"
    />,
    size
  );
}
