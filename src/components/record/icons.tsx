// Inline SVG marks reproduced from the v3 prototype.

export function PvMark({ className = "pv-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 34 38" fill="none" aria-hidden="true">
      <path
        d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z"
        stroke="#C79B3D"
        strokeWidth="1.6"
      />
      <text
        x="17"
        y="23.5"
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontSize="13"
        fill="#C79B3D"
        fontWeight="600"
      >
        PV
      </text>
    </svg>
  );
}

export function ShieldIcon({ size = 13, fillSoft = false }: { size?: number; fillSoft?: boolean }) {
  return (
    <svg width={size} height={size + 1} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5l5 2v3.6c0 3.2-2.1 5.7-5 7.4-2.9-1.7-5-4.2-5-7.4V3.5l5-2z"
        stroke="#E0BE72"
        strokeWidth="1.4"
        fill={fillSoft ? "rgba(199,155,61,.12)" : "none"}
      />
      <path
        d="M5.6 8l1.7 1.7L10.6 6.3"
        stroke="#E0BE72"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldOutline({ size = 14, stroke = "#C79B3D" }: { size?: number; stroke?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flex: "none", marginTop: 2 }}
      aria-hidden="true"
    >
      <path
        d="M8 1.5l5 2v3.6c0 3.2-2.1 5.7-5 7.4-2.9-1.7-5-4.2-5-7.4V3.5l5-2z"
        stroke={stroke}
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function GoldTick({ className = "tick" }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#C79B3D" />
      <path
        d="M5 8.2l2 2L11.2 6"
        stroke="#10131C"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 1v8m0 0L4 6.2M7 9l3-2.8M2 12.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
