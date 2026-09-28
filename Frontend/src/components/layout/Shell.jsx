import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { NAV, activeNav } from './nav';

// Phones, signed in: a floating switch at the bottom — the chosen place is
// the raised pitch pill, and it slides between tabs like the kit's
// Segmented. Hidden on md+ (the app bar carries the links) and during
// onboarding (/register), where it would only distract.
function TabBar() {
  const { data: me } = useMe();
  const { pathname } = useLocation();
  if (!me || pathname === '/register') return null;

  const active = activeNav(pathname);
  const share = `((100% - 12px) / ${NAV.length})`;

  return (
    <nav aria-label="التنقل" className="fixed inset-x-3 z-40 md:hidden" style={{ bottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
      <div className="relative grid rounded-full border-2 border-edge bg-night-2 p-1.5 shadow-hard" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
        {active >= 0 && (
          <span
            className="absolute inset-y-1.5 rounded-full border-2 border-edge bg-pitch transition-[inset-inline-start] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
            style={{ insetInlineStart: `calc(6px + ${active} * ${share})`, width: `calc${share}` }}
            aria-hidden
          />
        )}
        {NAV.map(({ to, label, icon: Icon }, i) => (
          <Link
            key={to}
            to={to}
            aria-current={i === active ? 'page' : undefined}
            className={cn(
              'relative z-10 flex h-[52px] flex-col items-center justify-center gap-1 rounded-full font-display text-[11.5px] font-semibold leading-none transition-colors duration-200',
              i === active ? 'text-edge' : 'text-white/60 active:text-white',
            )}
          >
            <Icon size={19} strokeWidth={i === active ? 2.8 : 2.4} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Shell() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-night">
      <Outlet />
      <TabBar />
    </div>
  );
}
