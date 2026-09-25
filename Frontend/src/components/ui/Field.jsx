import { cn } from '@/lib/cn';

const control =
  'w-full rounded-chip border border-line-strong bg-paper px-4 py-3.5 text-[15px] font-bold text-ink outline-none transition-colors focus:border-ink disabled:bg-line disabled:text-muted';

export function Field({ label, hint, optional, error, className, children }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] font-black">{label}</span>
          {optional && <span className="text-[11.5px] font-bold text-muted">اختياري</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-2 text-[12px] font-bold text-action">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[12px] font-semibold text-muted">{hint}</p>
      ) : null}
    </label>
  );
}

export const Input = ({ className, ...props }) => <input className={cn(control, className)} {...props} />;

export const Textarea = ({ className, ...props }) => (
  <textarea className={cn(control, 'min-h-[96px] resize-y leading-relaxed', className)} {...props} />
);

export const Select = ({ className, children, ...props }) => (
  <select className={cn(control, 'appearance-none', className)} {...props}>
    {children}
  </select>
);

// Big latin input for IDs and codes
export const CodeInput = ({ className, ...props }) => (
  <input
    dir="ltr"
    className={cn(control, 'num text-center text-[24px] tracking-[.12em] py-4', className)}
    autoComplete="off"
    {...props}
  />
);

// A choice tile: sharp (data) — used for GW pickers
export function Tile({ active, onClick, label, value, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-panel border px-1 py-2.5 text-center transition-colors',
        active ? 'border-ink bg-ink text-brand' : 'border-line-strong bg-paper text-ink',
        className,
      )}
    >
      {label && <div className={cn('num text-[10px] tracking-[.14em]', active ? 'text-canvas' : 'text-muted')}>{label}</div>}
      <div className={cn(value && String(value).length > 4 ? 'text-[12px] font-extrabold' : 'num-display text-[24px] leading-none')}>{value}</div>
    </button>
  );
}

// Inline message strip (info / error). Never red as a background — the law.
export function Notice({ tone = 'info', children, className }) {
  return (
    <div className={cn('flex gap-2.5 rounded-chip bg-canvas px-3.5 py-3 text-[12.5px] font-semibold leading-relaxed', className)}>
      <span
        className={cn('mt-1.5 block h-[9px] w-[9px] shrink-0 rounded-full', tone === 'error' ? 'bg-action' : 'bg-live')}
        aria-hidden
      />
      <div className="min-w-0 text-ink">{children}</div>
    </div>
  );
}
