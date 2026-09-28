// The VAR monitor — results being checked before they're final ("closing").
// The bar inside fills and restarts; still for reduced motion.
export function VarScreen({ className }) {
  return (
    <svg viewBox="0 0 120 92" className={className} aria-hidden>
      <g stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <path d="M52 70l-5 15h26l-5-15" fill="var(--color-night-3)" />
        <rect x="8" y="6" width="104" height="66" rx="12" fill="var(--color-night-3)" />
      </g>
      <text x="60" y="44" textAnchor="middle" fill="#fff" fontFamily="var(--font-display)" fontWeight="800" fontSize="24" letterSpacing="2">VAR</text>
      <rect x="26" y="53" width="68" height="7" rx="3.5" fill="rgba(255,255,255,.12)" />
      <rect x="26" y="53" width="68" height="7" rx="3.5" fill="var(--color-pitch)" className="origin-right motion-safe:animate-check" style={{ transformBox: 'fill-box' }} />
    </svg>
  );
}
