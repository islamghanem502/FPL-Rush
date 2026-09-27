import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';

// The logo is a switch turned on, next to the name. `animate` flips it on once
// when the page opens — the brand "switching on".
export function Wordmark({ animate = false, className }) {
  const root = useRef(null);

  useGSAP(
    () => {
      if (!animate) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ delay: 0.25 })
          .from('.js-track', { backgroundColor: '#d9d9de', duration: 0.25 }) // mist → pitch
          .from('.js-knob', { x: 16, duration: 0.55, ease: 'back.out(2.2)' }, '<');
      });
    },
    { scope: root },
  );

  return (
    <Link ref={root} to="/" aria-label="FPL Rush" className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="js-track relative h-[22px] w-[38px] rounded-full border-2 border-edge bg-pitch" aria-hidden>
        <span className="js-knob knob absolute left-[2px] top-1/2 size-[14px] -translate-y-1/2" />
      </span>
      <span dir="ltr" className="whitespace-nowrap font-display text-[19px] font-extrabold leading-none tracking-tight text-white">
        FPL <span className="text-pitch">RUSH</span>
      </span>
    </Link>
  );
}
