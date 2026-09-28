import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ArrowIcon } from './icons';

// Web links open in a new tab; mailto:/tel: stay in place.
const external = (href) => (/^(mailto|tel):/.test(href) ? {} : { target: '_blank', rel: 'noreferrer' });

// Every button is a tactile pill: black edge, hard shadow, sinks when pressed.
// `primary` is pitch with black text; `secondary` is a sunk night surface.
// `knob` adds the white knob with a forward arrow — it slides on hover like a
// switch turning on. Use it on the action that moves the user forward.
const VARIANTS = {
  primary: 'bg-pitch text-edge',
  secondary: 'bg-night-3 text-white',
};

const SIZES = {
  lg: { base: 'h-13 gap-3 px-6 text-[16px] md:h-14 md:px-7 md:text-[17px]', knob: 'size-8 md:size-9', icon: 17, pad: 'pe-2 md:pe-2.5' },
  md: { base: 'h-12 gap-2.5 px-5 text-[15px]', knob: 'size-8', icon: 16, pad: 'pe-2' },
  sm: { base: 'h-10 gap-2 px-4 text-[13.5px]', knob: 'size-7', icon: 14, pad: 'pe-1.5' },
};

// `loading` / `disabled` flatten the button (no shadow — see `press`).
export function Button({ variant = 'primary', size = 'md', knob = false, full = false, loading = false, disabled = false, to, href, className, children, ...props }) {
  const s = SIZES[size];
  const inactive = disabled || loading;
  const classes = cn(
    'press group inline-flex cursor-pointer select-none items-center justify-center rounded-full border-2 border-edge font-display font-bold leading-none',
    VARIANTS[variant],
    s.base,
    knob && s.pad,
    full && 'w-full',
    className,
  );
  const body = (
    <>
      <span className="inline-flex items-center gap-2" aria-live={loading ? 'polite' : undefined}>{loading ? 'لحظة…' : children}</span>
      {knob && (
        <span
          className={cn(
            'knob grid shrink-0 place-items-center text-edge transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-x-1',
            s.knob,
            full && 'ms-auto',
          )}
        >
          <ArrowIcon size={s.icon} />
        </span>
      )}
    </>
  );

  if (to) return <Link to={to} className={classes} {...props}>{body}</Link>;
  if (href) return <a href={href} {...external(href)} className={classes} {...props}>{body}</a>;
  return <button type="button" disabled={inactive} className={classes} {...props}>{body}</button>;
}

// Text action — for secondary routes ("forgot password?", "skip for now").
// Underlined so it never passes for a label, never tactile so it never passes
// for a button.
export function TextLink({ to, href, onClick, className, children }) {
  const classes = cn(
    'cursor-pointer font-display text-[14px] font-semibold text-white underline decoration-white/30 decoration-2 underline-offset-[6px] transition-colors hover:text-pitch hover:decoration-pitch',
    className,
  );
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  if (href) return <a href={href} {...external(href)} className={classes}>{children}</a>;
  return <button type="button" onClick={onClick} className={classes}>{children}</button>;
}

// The round pitch button with a white glyph (the "send" button).
export function IconButton({ label, to, size = 48, className, children, ...props }) {
  const classes = cn('press grid shrink-0 place-items-center rounded-full border-2 border-edge bg-pitch text-white', className);
  const style = { width: size, height: size };
  if (to) return <Link to={to} aria-label={label} className={classes} style={style} {...props}>{children}</Link>;
  return <button type="button" aria-label={label} className={classes} style={style} {...props}>{children}</button>;
}
