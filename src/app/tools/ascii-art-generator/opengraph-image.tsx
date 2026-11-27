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
      title="ASCII Art Generator"
      description="Turn short text into copyable character art."
      footer="No uploads · copy text + PNG"
      accent="#8A6514"
    />,
    size
  );
}
