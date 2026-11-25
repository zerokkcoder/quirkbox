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
      description="Pick a language and gender, then have the name read aloud in your browser."
      footer="Rule-based · shareable · no sign-up"
      accent="#2F5596"
    />,
    size
  );
}
