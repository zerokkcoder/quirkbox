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
          background: "linear-gradient(135deg, #eaf1ff 0%, #ffffff 52%, #fff1e6 100%)",
          padding: "64px",
          color: "#1b2440",
        }}
      >
        <div style={{ fontSize: 28 }}>QuirkBox</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>Travel Footprint</div>
          <div style={{ fontSize: 32, opacity: 0.85, maxWidth: "860px" }}>
            Drop a home, add every place you have been, and draw your own routes.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, opacity: 0.75 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: "#e11d48" }} />
          <span style={{ width: 220, height: 4, borderRadius: 2, background: "#2563eb" }} />
          <span style={{ width: 18, height: 18, borderRadius: 9, background: "#3b82f6" }} />
          <span>Custom lines, auto-fit view, PNG &amp; data export.</span>
        </div>
      </div>
    ),
    size
  );
}
