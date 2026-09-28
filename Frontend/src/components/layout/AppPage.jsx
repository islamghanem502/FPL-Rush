import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { AppBar } from './AppBar';

// Frame for every signed-in screen: night page, the app bar, one content
// column. Each direct child of the column rises in on arrival — again when
// `stepKey` changes (e.g. loading → loaded, step 1 → step 2). Phones keep
// room at the bottom for the tab bar.
export function AppPage({ back, end, narrow = false, stepKey, className, children }) {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.js-page > *', { y: 22, autoAlpha: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' });
      });
    },
    { scope: root, dependencies: [stepKey], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="theme-night min-h-dvh overflow-x-clip">
      <AppBar back={back} end={end} />
      <main
        className={cn(
          'js-page mx-auto flex w-full flex-col gap-8 px-4 pb-32 pt-3 md:gap-10 md:px-8 md:pb-24 md:pt-8',
          narrow ? 'max-w-[680px]' : 'max-w-[1120px]',
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
