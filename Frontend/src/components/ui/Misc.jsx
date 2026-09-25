import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

// Clean round avatar: original photo in full color, or initials for fallback.
export function Avatar({ user, size = 34, className }) {
  const style = { width: size, height: size };
  if (user?.avatar) {
    return (
      <div style={style} className={cn('shrink-0 overflow-hidden rounded-full bg-ink/10', className)}>
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      style={{ ...style, fontSize: Math.round(size * 0.38) }}
      className={cn('num flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-ink', className)}
    >
      {initials(user?.managerName || user?.email)}
    </div>
  );
}

// A logo/photo box for a challenge — clean square with radius 10.
export function Logo({ src, size = 54, className }) {
  const style = { width: size, height: size };
  if (!src) {
    return (
      <div
        style={style}
        className={cn('shrink-0 rounded-chip', className)}
      >
        <div className="h-full w-full rounded-chip" style={{ background: 'repeating-linear-gradient(135deg,#1A1A1A 0 8px,#F5D623 8px 16px)' }} />
      </div>
    );
  }
  return (
    <div style={style} className={cn('shrink-0 overflow-hidden rounded-chip bg-ink/10', className)}>
      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

// Empty states carry a faint number, a reason and one action.
export function Empty({ number = '00', title, hint, action, className }) {
  return (
    <div className={cn('rounded-card bg-paper px-5 py-8 text-center', className)}>
      <div className="num-display text-[64px] leading-none text-line-strong">{number}</div>
      <div className="mt-2 text-[16px] font-black">{title}</div>
      {hint && <div className="mt-1 text-[12.5px] font-semibold text-muted">{hint}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ className }) => <div className={cn('animate-pulse rounded-card bg-line', className)} />;

export function Loading({ label = 'لحظة…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <span className="block h-3 w-3 rounded-full bg-live animate-livepulse" />
      <span className="text-[13px] font-bold">{label}</span>
    </div>
  );
}

// Segmented control — two or three pills inside a cream track
export function Segmented({ value, onChange, options, dark = false, className }) {
  return (
    <div className={cn('flex gap-1.5 rounded-full p-1', dark ? 'bg-canvas/15' : 'bg-canvas', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-full py-2 text-[12.5px] transition-colors',
            option.value === value ? (dark ? 'bg-brand font-black text-ink' : 'bg-ink font-black text-brand') : dark ? 'font-bold text-canvas' : 'font-bold text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Prize row: white surface, small yellow mark. Yellow fill is reserved for you.
export function PrizeRow({ place, prize, className }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-chip border border-line-strong bg-paper px-3.5 py-2.5', className)}>
      <span className="block h-3 w-3 shrink-0 rounded-[3px] bg-brand" aria-hidden />
      <span className="shrink-0 text-[11.5px] font-black">{place}</span>
      <span className="h-[18px] w-px bg-line-strong" aria-hidden />
      <span className="min-w-0 truncate text-[13.5px] font-bold">{prize}</span>
    </div>
  );
}

// Back arrow: in RTL the way back points right
export const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Bonus tracker button — sports match telemetry style with live data bars
export function BonusButton({ className }) {
  return (
    <Link
      to="/bonus"
      className={cn(
        'group inline-flex items-center gap-3 rounded-[14px] bg-ink px-4 py-2.5 text-canvas border-0 shadow-[0_4px_0_0_#000000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#000000] active:translate-y-1 active:shadow-[0_1px_0_0_#000000]',
        className
      )}
    >
      {/* Live match equalizer signal bars */}
      <span
        className="flex items-end gap-[2.5px] h-[15px] px-1.5 py-0.5 rounded-[5px] bg-canvas/10"
        title="مباشر"
        aria-hidden
      >
        <span className="w-[2.5px] h-2 bg-live rounded-full animate-pulse" />
        <span className="w-[2.5px] h-3.5 bg-live rounded-full animate-pulse [animation-delay:200ms]" />
        <span className="w-[2.5px] h-2.5 bg-live rounded-full animate-pulse [animation-delay:400ms]" />
      </span>

      {/* Label */}
      <span className="text-[14px] font-black tracking-tight text-canvas transition-colors group-hover:text-brand">
        تابع بونص اللاعبين
      </span>

      {/* Sleek directional chevron without circular wrapper */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-canvas/40 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-brand"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}

