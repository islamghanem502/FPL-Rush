import { cn } from '@/lib/cn';
import { LiveBars } from './icons';

// A small flat label that carries a state — never pressable, so never raised.
// `live` is volt with the moving bars (a challenge or a match in play right now).
const TONES = {
  plain: 'bg-white/[.07] text-white/80',
  pitch: 'bg-pitch/15 text-pitch',
  live: 'bg-volt/10 text-volt',
  ghost: 'text-white/55 ring-1 ring-inset ring-white/12',
  alert: 'bg-alert/10 text-alert',
};

export function Tag({ tone = 'plain', icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-display text-[12.5px] font-semibold leading-none',
        TONES[tone],
        className,
      )}
    >
      {tone === 'live' && !icon ? <LiveBars className="h-3" /> : icon}
      {children}
    </span>
  );
}
