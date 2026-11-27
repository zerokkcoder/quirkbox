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
      title="About StarRudder"
      description="Free tools that run in your browser. No account, no uploads, no stored data."
      footer="starrudder.cc/about"
    />,
    size
  );
}
