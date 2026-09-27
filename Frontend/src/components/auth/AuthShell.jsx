import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { Wordmark } from '@/components/site/Wordmark';

// Shared frame for the account screens: slim top bar, the form column, and —
// on desktop only — an aside showing what this step is about. Each direct
// child of the form column rises in, again whenever `stepKey` changes.
export function AuthShell({ end, aside, stepKey, children }) {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.js-auth > *', { y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out' });
      });
    },
    { scope: root, dependencies: [stepKey], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="theme-night min-h-dvh overflow-x-clip">
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-3 px-4 md:h-[72px] md:px-8">
        <Wordmark />
        {end}
      </header>
      <main
        className={cn(
          'mx-auto grid w-full grid-cols-[minmax(0,1fr)] items-start gap-16 px-4 pb-16 pt-4 md:px-8 md:pt-12',
          aside ? 'max-w-[1120px] md:grid-cols-[minmax(0,440px)_1fr]' : 'max-w-[520px]',
        )}
      >
        <div className="js-auth flex min-w-0 flex-col gap-6 md:gap-7">{children}</div>
        {aside && <aside className="sticky top-8 hidden md:block">{aside}</aside>}
      </main>
    </div>
  );
}

export function AuthTitle({ title, sub }) {
  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold leading-[1.25] md:text-[42px]">{title}</h1>
      {sub && <p className="mt-2.5 text-[14.5px] leading-[1.8] text-white/65 md:mt-3 md:text-[15.5px]">{sub}</p>}
    </div>
  );
}
