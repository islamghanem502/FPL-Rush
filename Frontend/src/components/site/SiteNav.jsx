import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { CloseIcon, MenuIcon } from '@/components/kit/icons';
import { Wordmark } from './Wordmark';

// Sticky site nav. Links are plain text (not tactile) so they never compete
// with buttons. `links`: { label, to } for routes, { label, onClick } for
// in-page jumps (smooth scroll, no URL change).
// `actions` sit at the end on every size; `menuAction` joins the phone menu.
// `active: true` marks the page you are on. `animate` flips the logo on once.
export function SiteNav({ links = [], actions, menuAction, animate = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const item = (link, className) => {
    const props = { className, children: link.label, 'aria-current': link.active ? 'page' : undefined };
    if (link.to) return <Link key={link.label} to={link.to} onClick={() => setOpen(false)} {...props} />;
    return <button key={link.label} type="button" onClick={() => { setOpen(false); link.onClick(); }} {...props} />;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,box-shadow] duration-200',
        (scrolled || open) && 'bg-night/90 shadow-[0_1px_0_rgba(255,255,255,.07)] backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-6 px-4 md:h-[72px] md:px-8">
        <Wordmark animate={animate} />
        <nav aria-label="أقسام الموقع" className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
            item(link, 'cursor-pointer rounded-full px-3 py-2 text-[14.5px] font-medium text-white/70 transition-colors hover:bg-white/[.06] hover:text-white aria-[current=page]:bg-white/[.08] aria-[current=page]:text-white'),
          )}
        </nav>
        <div className="ms-auto flex items-center gap-2.5">
          {actions}
          <button
            type="button"
            aria-label={open ? 'إغلاق القائمة' : 'القائمة'}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
            className="press grid size-10 cursor-pointer place-items-center rounded-full border-2 border-edge bg-night-3 text-white md:hidden"
          >
            {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {/* Overlays the page instead of pushing it, so in-page jumps land where
          they were aimed after the menu closes. */}
      {open && (
        <div id="site-menu" className="absolute inset-x-0 top-full border-y border-white/[.07] bg-night px-4 pb-6 pt-2 md:hidden">
          <nav aria-label="أقسام الموقع" className="flex flex-col">
            {links.map((link) =>
              item(link, 'cursor-pointer border-b border-white/[.07] py-4 text-start font-display text-[18px] font-semibold text-white aria-[current=page]:text-pitch'),
            )}
          </nav>
          {menuAction && <div className="mt-5">{menuAction}</div>}
        </div>
      )}
    </header>
  );
}
