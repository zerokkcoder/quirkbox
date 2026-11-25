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
      title="Random Name Generator"
      description="Full names in 14 languages, written in native script and read aloud by your browser."
      footer="No signup · runs in your browser"
      accent="#2F5596"
    />,
    size
  );
}
