import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #eaf1ff 0%, #ffffff 45%, #fff6e4 100%)",
          padding: "64px",
          color: "#131a2e",
        }}
      >
        <div style={{ fontSize: 30, opacity: 0.7 }}>{siteConfig.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 70, fontWeight: 700, maxWidth: "900px", lineHeight: 1.05 }}>
            Random Name Generator, Pixel Avatar Maker, and more fun tools.
          </div>
          <div style={{ fontSize: 30, opacity: 0.8, maxWidth: "820px" }}>
            A playful toolbox with shareable generator pages and light, deterministic interactions.
          </div>
        </div>
        <div style={{ display: "flex", gap: "14px" }}>
          <div style={{ borderRadius: 9999, background: "#1d4ed8", color: "white", padding: "12px 24px", fontSize: 28 }}>
            QuirkBox
          </div>
          <div style={{ borderRadius: 9999, background: "#ffffff", padding: "12px 24px", fontSize: 28 }}>
            Launch tools: 2
          </div>
        </div>
      </div>
    ),
    size
  );
}
