import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useMe } from '@/hooks/useAuth';
import { NAV } from './nav';

// Page content column: one column, phone-first, comfortable on desktop.
export function Page({ className, wide = false, children }) {
  const { data: me } = useMe();
  return (
    <main className={cn('mx-auto w-full max-w-[600px] px-5 pt-4 md:pb-12', me ? 'pb-28' : 'pb-10', wide && 'md:max-w-[960px]', className)}>
      {children}
    </main>
  );
}

// Bottom bar on phones for signed-in users. Hidden on md+ (chrome has links).
function TabBar() {
  const { data: me } = useMe();
  if (!me) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-chrome bg-ink px-3 pb-3 pt-3 safe-bottom md:hidden">
      <div className="grid grid-cols-3 gap-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('rounded-full py-2.5 text-center text-[13px]', isActive ? 'bg-brand font-black text-ink' : 'font-bold text-canvas')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Shell() {
  return (
    <div className="min-h-dvh bg-canvas overflow-x-hidden">
      <Outlet />
      <TabBar />
    </div>
  );
}
