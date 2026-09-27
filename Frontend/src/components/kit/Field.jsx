import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Toggle } from './Toggle';

// Fields are `sunk` — set into the surface — the opposite of raised,
// pressable buttons. Text is 16px so iOS never zooms on focus.

export function Field({ id, label, hint, aside, className, children }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-display text-[14px] font-semibold">{label}</label>
        {aside}
      </div>
      {children}
      {hint && <p className="mt-2 text-[12.5px] text-white/50">{hint}</p>}
    </div>
  );
}

export const Input = ({ className, ...props }) => (
  <input
    className={cn('sunk h-13 w-full rounded-[16px] px-4 text-[16px] text-white outline-none placeholder:text-white/30', className)}
    {...props}
  />
);

// Password with a real switch for "show" (controlled or not). Pass the same
// `visible` to a confirm field so both reveal together; `toggle={false}` on
// the confirm field keeps one switch per form.
export function PasswordInput({ id, visible, onVisible, toggle = true, className, ...props }) {
  const [own, setOwn] = useState(false);
  const shown = visible ?? own;
  const setShown = onVisible ?? setOwn;
  return (
    <div className={cn('sunk flex h-13 items-center gap-2.5 rounded-[16px] pe-2.5 ps-4', className)}>
      <input id={id} type={shown ? 'text' : 'password'} className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/30" {...props} />
      {toggle && (
        <>
          <span className="text-[12px] text-white/45" aria-hidden>إظهار</span>
          <Toggle size="sm" checked={shown} onChange={setShown} label="إظهار كلمة المرور" />
        </>
      )}
    </div>
  );
}

// One real input under N visual cells: paste, SMS autofill and deleting all
// just work. The active cell carries a caret.
export function OtpInput({ id, value, onChange, length = 6, className, ...props }) {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);
  return (
    <div dir="ltr" className={cn('relative', className)}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }} aria-hidden>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              'sunk grid h-13 place-items-center rounded-[12px] font-display text-[22px] font-bold tabular-nums md:h-15 md:rounded-[14px] md:text-[26px]',
              focused && i === active && 'border-pitch',
            )}
          >
            {value[i] || (focused && i === active ? <span className="h-6 w-0.5 animate-pulse rounded-full bg-pitch" /> : '')}
          </span>
        ))}
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        {...props}
      />
    </div>
  );
}
