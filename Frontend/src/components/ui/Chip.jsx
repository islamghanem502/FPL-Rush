import { cn } from '@/lib/cn';

// A chip carries a state or a number. Nothing else.
const VARIANTS = {
  live: 'bg-live text-ink font-black',        // live · verified · data
  brand: 'bg-brand text-ink font-black',      // you
  gw: 'bg-canvas text-ink num tracking-[.08em] text-[11px]',
  cream: 'bg-canvas text-ink font-bold',       // arabic text on cream
  outline: 'border-[1.5px] border-muted text-muted font-extrabold',
  ink: 'bg-ink text-brand font-black',
  mono: 'bg-canvas text-ink mono text-[11px]',
  dark: 'bg-canvas/12 text-canvas font-extrabold', // on black chrome
  darkMono: 'bg-canvas/12 text-canvas mono text-[11px]',
};

export function Chip({ variant = 'gw', pulse = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] leading-none whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {pulse && <span className="block h-[7px] w-[7px] rounded-full bg-ink animate-livepulse" aria-hidden />}
      {children}
    </span>
  );
}

export const LiveChip = ({ children = 'مباشر', className }) => (
  <Chip variant="live" pulse className={className}>{children}</Chip>
);
