import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #eaf1ff 0%, #ffffff 55%, #e6efff 100%)",
          padding: "64px",
          color: "#1b2440",
        }}
      >
        <div style={{ fontSize: 28 }}>QuirkBox</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>Random Name Generator</div>
          <div style={{ fontSize: 32, opacity: 0.85, maxWidth: "820px" }}>
            Pick a language and gender, then read the name out loud in your browser.
          </div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.75 }}>Rule-based, shareable, SEO-ready.</div>
      </div>
    ),
    size
  );
}
