const GOLD = "#E3BC6B";
const STAR = "#F4F1E8";
const MUTED = "#A9B6D6";

/** Star field drawn with plain divs so it renders reliably in satori. */
function StarField() {
  const stars = [
    [110, 90, 3],
    [260, 160, 2],
    [420, 70, 4],
    [560, 210, 2],
    [700, 110, 3],
    [880, 180, 2],
    [1040, 80, 4],
    [1150, 240, 2],
    [150, 470, 2],
    [330, 550, 3],
    [620, 500, 2],
    [960, 540, 3],
  ] as const;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {stars.map(([left, top, size], index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left,
            top,
            width: size,
            height: size,
            borderRadius: size,
            background: STAR,
            opacity: 0.45,
          }}
        />
      ))}
    </div>
  );
}

/** Helm ring + Polaris, built from divs for satori compatibility. */
function HelmMark() {
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: 92,
        height: 92,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 92,
          height: 92,
          borderRadius: 46,
          border: `2px solid ${GOLD}`,
          opacity: 0.85,
        }}
      />
      {spokes.map((angle) => {
        const radians = (angle * Math.PI) / 180;
        const radius = 51;
        return (
          <div
            key={angle}
            style={{
              position: "absolute",
              left: 46 + radius * Math.cos(radians) - 2.5,
              top: 46 + radius * Math.sin(radians) - 2.5,
              width: 5,
              height: 5,
              borderRadius: 3,
              background: GOLD,
            }}
          />
        );
      })}
      <div
        style={{
          width: 26,
          height: 26,
          transform: "rotate(45deg)",
          background: GOLD,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

export function OGCard({
  title,
  description,
  footer,
  accent,
}: {
  title: string;
  description: string;
  footer: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0B1024 0%, #162248 58%, #22315C 100%)",
        padding: "64px",
        color: STAR,
      }}
    >
      <StarField />
      <div
        style={{
          position: "absolute",
          right: -140,
          top: -140,
          width: 460,
          height: 460,
          borderRadius: 230,
          background: accent ?? "#2A4E8C",
          opacity: 0.28,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <HelmMark />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1, color: GOLD }}>
            StarRudder
          </div>
          <div style={{ fontSize: 20, color: MUTED }}>Small tools for the journey</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: 960 }}>
          {title}
        </div>
        <div style={{ fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 900 }}>
          {description}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: GOLD }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: GOLD }} />
        <span>{footer}</span>
      </div>
    </div>
  );
}
