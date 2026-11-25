import { cn } from "@/lib/utils";

/**
 * StarRudder mark: an eight-spoke helm ring around a Polaris star.
 * Single-color currentColor so it inherits the golden primary tone.
 */
export function BrandMark({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0", className)}
    >
      {/* Helm ring */}
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.35" opacity="0.9" />
      {/* Eight steering spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const radians = (angle * Math.PI) / 180;
        const innerRadius = 8.25;
        const outerRadius = 10.75;
        return (
          <line
            key={angle}
            x1={12 + innerRadius * Math.cos(radians)}
            y1={12 + innerRadius * Math.sin(radians)}
            x2={12 + outerRadius * Math.cos(radians)}
            y2={12 + outerRadius * Math.sin(radians)}
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.9"
          />
        );
      })}
      {/* Polaris */}
      <path
        d="M12 5.6 13.35 10.65 18.4 12 13.35 13.35 12 18.4 10.65 13.35 5.6 12 10.65 10.65Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
