import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/motion/gsap';

const ITEMS = ['منافسة بالمهارة فقط', 'تحديات بجولات محددة', 'ترتيب مباشر', 'بونص اللاعبين لحظة بلحظة', 'جوائز حقيقية للأوائل'];

// A broadcast-style ticker. Arabic tickers run left → right so each phrase
// enters from its start. Scrolling the page pushes it faster for a moment.
export function Ticker() {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const loop = gsap.to('.js-reel', { xPercent: 50, duration: 32, ease: 'none', repeat: -1 });
        let calm;
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            loop.timeScale(gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 250));
            calm?.kill();
            calm = gsap.to(loop, { timeScale: 1, duration: 1.2, ease: 'power2.out' });
          },
        });
      });
    },
    { scope: root },
  );

  // Two identical copies; moving by one copy's width loops seamlessly.
  const copy = (hidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-5 pe-5">
          <span className="whitespace-nowrap">{item}</span>
          <span className="knob size-3.5" aria-hidden />
        </span>
      ))}
    </div>
  );

  return (
    // Full-bleed and tilted: wider than the viewport so the ends never show.
    <div ref={root} className="relative -mx-[5vw] my-12 -rotate-2 md:my-20">
      <div className="overflow-hidden border-y-2 border-edge bg-pitch py-3.5">
        <div className="js-reel flex w-max font-display text-[17px] font-bold text-edge md:text-[20px]">
          {copy(false)}
          {copy(true)}
        </div>
      </div>
    </div>
  );
}
