// A ticket torn in two — a link or a code that no longer opens anything.
const TEAR = 'L120 52 L110 64 L120 76 L110 88 L120 100 L112 112';

export function TornTicket({ className }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <ellipse cx="120" cy="138" rx="86" ry="4" fill="rgba(0,0,0,.35)" />
      <g stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <g transform="rotate(-5 75 76)">
          <path d={`M40 40H112${TEAR}H40Q30 112 30 102V50Q30 40 40 40Z`} fill="var(--color-pitch)" />
          <circle cx="70" cy="76" r="12" fill="#fff" />
        </g>
        <g transform="translate(16 10) rotate(8 160 76)">
          <path d={`M112 40${TEAR}H200Q210 112 210 102V50Q210 40 200 40Z`} fill="var(--color-night-3)" />
        </g>
      </g>
      <g transform="translate(16 10) rotate(8 160 76)" fill="rgba(255,255,255,.22)">
        <rect x="138" y="58" width="50" height="7" rx="3.5" />
        <rect x="138" y="72" width="36" height="7" rx="3.5" />
        <rect x="138" y="86" width="44" height="7" rx="3.5" />
      </g>
      <g fill="rgba(255,255,255,.35)">
        <path d="M126 28l5 3-5 3z" />
        <path d="M118 124l6 1-3 5z" />
        <circle cx="134" cy="132" r="2" />
      </g>
    </svg>
  );
}
