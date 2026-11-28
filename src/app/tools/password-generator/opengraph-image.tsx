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
      title="Password Generator"
      description="Strong passwords and passphrases, generated on your device."
      footer="Local CSPRNG · no uploads"
      accent="#2B5F8A"
    />,
    size
  );
}
