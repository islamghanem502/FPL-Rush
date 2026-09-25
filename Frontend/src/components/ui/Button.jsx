import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

// One primary (red, with the yellow disc) per screen. Everything else is
// secondary (outlined) or tertiary (text). `brand` is the winner-context
// exception: the yellow share button on the champions screen.
// `dark` = the button sits on the black chrome.
const VARIANTS = {
  primary: { light: 'bg-action text-ink active:bg-action-press', dark: 'bg-action text-ink active:bg-action-press' },
  brand: { light: 'bg-brand text-ink', dark: 'bg-brand text-ink' },
  secondary: { light: 'border-2 border-ink text-ink bg-transparent', dark: 'border-2 border-canvas text-canvas bg-transparent' },
  tertiary: { light: 'text-ink bg-transparent', dark: 'text-canvas bg-transparent' },
};

const SIZES = {
  lg: 'py-4 px-6 text-[17px] font-black',
  md: 'py-3 px-5 text-[15px] font-extrabold',
  sm: 'py-2 px-4 text-[13px] font-extrabold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  dark = false,
  disabled = false,
  loading = false,
  className,
  children,
  to,
  href,
  as: Static, // render a non-interactive element (e.g. a CTA look inside a <Link>)
  ...props
}) {
  const inactive = disabled || loading;
  const disc = variant === 'primary' && !inactive;
  const classes = cn(
    'inline-flex items-center justify-center gap-2.5 rounded-full leading-none select-none transition-transform active:scale-[.98]',
    SIZES[size],
    inactive ? 'bg-disabled text-disabled-text border-0 cursor-not-allowed' : VARIANTS[variant][dark ? 'dark' : 'light'],
    full && 'w-full',
    className,
  );
  const body = (
    <>
      {disc && <span className="block h-3 w-3 shrink-0 rounded-full bg-brand" aria-hidden />}
      {variant === 'brand' && !inactive && <span className="block h-3 w-3 shrink-0 rounded-full bg-ink" aria-hidden />}
      <span className="inline-flex items-center gap-2">{loading ? 'لحظة…' : children}</span>
    </>
  );

  if (Static) return <Static className={classes} {...props}>{body}</Static>;
  if (to && !inactive) return <Link to={to} className={classes} {...props}>{body}</Link>;
  if (href && !inactive) return <a href={href} target="_blank" rel="noreferrer" className={classes} {...props}>{body}</a>;
  return (
    <button type="button" disabled={inactive} className={classes} {...props}>
      {body}
    </button>
  );
}
