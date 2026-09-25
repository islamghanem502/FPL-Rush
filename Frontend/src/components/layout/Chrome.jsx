import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { Avatar, BackArrow } from '@/components/ui/Misc';
import { NAV } from './nav';

export const Wordmark = ({ className }) => (
  <Link to="/" className={cn('jersey text-[20px] leading-none text-canvas', className)}>
    FPL <span className="text-brand">RUSH</span>
  </Link>
);

/**
 * The black chrome at the top of every screen. Stripe once, rounded bottom.
 *  - default:        wordmark · (desktop nav) · avatar / login
 *  - title:          title · wordmark                (hub screens)
 *  - back + title:   ← title · wordmark              (sub-pages)
 *  - right:          override the end slot; `user={false}` hides the avatar
 * `children` render inside the black area (greeting, search, steps…).
 */
export function Chrome({ title, back, right, user = true, children, className }) {
  const navigate = useNavigate();
  const { data: me } = useMe();

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(back === true ? '/' : back));
  const end = right !== undefined ? right
    : title ? <Wordmark className="text-[17px]" />
    : !user ? null
    : me ? <Link to="/profile" aria-label="حسابي"><Avatar user={me} /></Link>
    : <Link to="/login" className="rounded-full bg-brand px-4 py-1.5 text-[13px] font-black text-ink">دخول</Link>;

  return (
    <header className={cn('relative overflow-hidden bg-ink text-canvas rounded-b-chrome', className)}>
      <div className="stripe" />
      <div className="mx-auto w-full max-w-[600px] px-5 md:max-w-[960px]">
        <div className="flex h-14 items-center justify-between gap-3">
          {title ? (
            <div className="flex min-w-0 items-center gap-3">
              {back && (
                <button type="button" onClick={goBack} className="-mr-1 p-1" aria-label="رجوع">
                  <BackArrow />
                </button>
              )}
              <h1 className="truncate text-[17px] font-black">{title}</h1>
            </div>
          ) : (
            <Wordmark />
          )}

          <div className="flex items-center gap-4">
            {/* Desktop nav lives here; phones use the bottom bar */}
            {me && (
              <nav className="hidden items-center gap-1 md:flex">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn('rounded-full px-3.5 py-1.5 text-[13px]', isActive ? 'bg-brand font-black text-ink' : 'font-bold text-canvas')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
            {end}
          </div>
        </div>
        <div className={children ? 'pb-5 pt-1' : 'pb-4'}>{children}</div>
      </div>
    </header>
  );
}
