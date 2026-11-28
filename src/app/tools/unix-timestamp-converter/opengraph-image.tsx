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
      title="Unix Timestamp Converter"
      description="Epoch seconds to dates, in UTC or any time zone."
      footer="BigInt precision · no uploads"
      accent="#2F6F9B"
    />,
    size
  );
}
