import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { Wordmark } from '@/components/site/Wordmark';
import { Avatar } from '@/components/kit/Avatar';
import { Button } from '@/components/kit/Button';
import { BackIcon } from '@/components/kit/icons';
import { NAV, activeNav } from './nav';

// The signed-in app's top bar. Phones: (back) · logo · you. Desktop adds the
// four places as plain text links (the tab bar is phones-only).
//   back — true or a fallback path; shows the round back button
//   end  — replaces the avatar (e.g. the admin's "خروج")
export function AppBar({ back, end }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const active = activeNav(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(typeof back === 'string' ? back : '/home'));

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow] duration-200',
        scrolled && 'bg-night/90 shadow-[0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-3 px-4 md:h-[72px] md:gap-6 md:px-8">
        {back && (
          <button
            type="button"
            onClick={goBack}
            aria-label="رجوع"
            className="press grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-edge bg-night-3 text-white"
          >
            <BackIcon size={18} />
          </button>
        )}
        <Wordmark />
        {me && (
          <nav aria-label="أقسام التطبيق" className="hidden items-center gap-1 md:flex">
            {NAV.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={i === active ? 'page' : undefined}
                className="rounded-full px-3 py-2 text-[14.5px] font-medium text-white/70 transition-colors hover:bg-white/[.06] hover:text-white aria-[current=page]:bg-white/[.08] aria-[current=page]:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ms-auto flex items-center gap-2.5">
          {end !== undefined ? end : me ? (
            <Link to="/profile" aria-label="حسابي" className="press block shrink-0 rounded-full">
              <Avatar user={me} size={40} you />
            </Link>
          ) : (
            <Button variant="secondary" size="sm" to="/login">دخول</Button>
          )}
        </div>
      </div>
    </header>
  );
}
