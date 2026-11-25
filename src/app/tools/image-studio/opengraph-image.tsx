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
      title="Image Studio"
      description="Convert images between formats — right in your browser."
      footer="No uploads · nothing stored"
      accent="#3E5C9E"
    />,
    size
  );
}
