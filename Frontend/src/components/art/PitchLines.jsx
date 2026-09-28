import { cn } from '@/lib/cn';

// The markings of a pitch, drawn over a `mowed` surface. Decorative only;
// it scales to cover whatever card it sits in.
export function PitchLines({ className }) {
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={cn('pointer-events-none absolute inset-0 size-full', className)} aria-hidden>
      <g fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="2.5">
        <rect x="14" y="14" width="372" height="212" rx="4" />
        <path d="M200 14V226" />
        <circle cx="200" cy="120" r="42" />
        <rect x="14" y="62" width="58" height="116" />
        <rect x="14" y="94" width="22" height="52" />
        <path d="M72 96a28 28 0 0 1 0 48" />
        <rect x="328" y="62" width="58" height="116" />
        <rect x="364" y="94" width="22" height="52" />
        <path d="M328 96a28 28 0 0 0 0 48" />
      </g>
      <circle cx="200" cy="120" r="4" fill="rgba(255,255,255,.4)" />
    </svg>
  );
}
