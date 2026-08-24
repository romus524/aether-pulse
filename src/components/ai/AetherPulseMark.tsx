type MarkSize = "sm" | "md" | "lg" | "xl";

interface AetherPulseMarkProps {
  size?: MarkSize;
  active?: boolean;
  className?: string;
}

const SIZE: Record<MarkSize, number> = {
  sm: 18,
  md: 28,
  lg: 36,
  xl: 52,
};

/** Minimal AI + pulse + CSI mark used across the AetherPulse agent surfaces. */
export function AetherPulseMark({ size = "md", active = false, className }: AetherPulseMarkProps) {
  const px = SIZE[size];
  return (
    <span
      className={`ap-mark${active ? " ap-mark--active" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="21.5" className="ap-mark__ring" />
        <circle cx="24" cy="24" r="16.5" className="ap-mark__ring-inner" />
        <path
          className="ap-mark__wave"
          d="M9 24h6l2.4-7 3.2 14 3.6-18 3.4 16 2.6-5H39"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="2.2" className="ap-mark__core" />
      </svg>
    </span>
  );
}
