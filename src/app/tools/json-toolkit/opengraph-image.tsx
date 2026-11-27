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
      title="JSON Toolkit"
      description="Format, validate and convert JSON in your browser."
      footer="No uploads · settings-only links"
      accent="#8A6514"
    />,
    size
  );
}
