import { cn } from '@/lib/cn';
import { InfoIcon, LiveBars } from './icons';

// Waiting = the logo's switch flicking on and off.
export function Loader({ label = 'لحظة…', className }) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-3.5', className)}>
      <span className="relative block h-[26px] w-[44px] animate-flick-track rounded-full border-2 border-edge" aria-hidden>
        <span className="knob absolute right-[3px] top-1/2 -mt-2 block size-4 animate-flick" />
      </span>
      <span className="font-display text-[13.5px] font-medium text-white/55">{label}</span>
    </div>
  );
}

// `full` = the whole screen (route guards), otherwise a page-body block.
export const PageLoader = ({ label, full = false }) => (
  <div className={cn('grid place-items-center', full ? 'theme-night min-h-dvh' : 'min-h-[55vh]')}>
    <Loader label={label} />
  </div>
);

export const Skeleton = ({ className }) => <div className={cn('animate-pulse rounded-box bg-night-2', className)} aria-hidden />;

// Empty states carry a drawing, a reason, and at most one way forward.
export function Empty({ art, title, hint, action, className }) {
  return (
    <div className={cn('flex flex-col items-center rounded-box bg-night-2 px-5 pb-9 pt-7 text-center ring-1 ring-white/[.06]', className)}>
      {art && <div className="w-full max-w-[220px]">{art}</div>}
      <div className="mt-4 font-display text-[19px] font-bold leading-snug md:text-[21px]">{title}</div>
      {hint && <p className="mt-2 max-w-[340px] text-[14px] leading-[1.75] text-white/55">{hint}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

// An inline note. Flat, with the icon carrying the tone.
const NOTICE = {
  info: 'text-pitch',
  live: 'text-volt',
  alert: 'text-alert',
};

export function Notice({ tone = 'info', icon, className, children }) {
  return (
    <div className={cn('flex gap-3 rounded-[18px] bg-white/[.04] px-4 py-3.5 text-[13.5px] leading-[1.75] text-white/70 ring-1 ring-white/[.06]', className)}>
      <span className={cn('mt-[3px] shrink-0', NOTICE[tone])}>
        {icon || (tone === 'live' ? <LiveBars className="h-3.5" /> : <InfoIcon size={17} strokeWidth={2.4} />)}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
