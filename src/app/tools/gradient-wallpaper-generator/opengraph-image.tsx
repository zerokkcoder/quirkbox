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
      title="Gradient Wallpaper Generator"
      description="Drag color stops, copy CSS or export a high-res gradient wallpaper."
      footer="No signup · runs in your browser"
      accent="#3E5C9E"
    />,
    size
  );
}
