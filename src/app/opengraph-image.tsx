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
      title="Small tools for the journey."
      description="Generate a name, draw an avatar, compose a wallpaper, or chart a route — then share where you landed."
      footer="Four free tools · starrudder.cc"
      accent="#3B5FA8"
    />,
    size
  );
}
