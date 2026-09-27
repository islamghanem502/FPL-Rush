import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { Gw } from '@/components/kit/Gw';

// A loop-de-loop arrow from the note to the phone. The path is sampled from a
// prolate cycloid (x = t − k·sin t, y = k·cos t; k 1.9, t −2.6…3.7, rotated
// 16°, mirrored to flow right → left) and smoothed into cubic Béziers, so the
// loop's curvature is continuous — no hand-drawn kinks. The head follows the
// end tangent.
const LOOP =
  'M196 14C193.7 16 186.2 21.8 181.9 26.1C177.6 30.4 173.7 35 170.3 39.7C166.9 44.3 163.9 49.3 161.5 54.1C159 58.9 157 63.9 155.5 68.7C153.9 73.5 152.9 78.4 152.3 82.9C151.7 87.5 151.6 91.9 151.8 96.1C152 100.2 152.7 104.1 153.7 107.6C154.6 111.1 156 114.3 157.5 117C159 119.7 160.9 122.1 162.8 123.9C164.6 125.8 166.8 127.2 168.8 128.1C170.9 129 173.1 129.5 175.1 129.4C177.2 129.4 179.2 128.9 181 127.9C182.7 127 184.4 125.5 185.8 123.7C187.1 122 188.2 119.7 188.9 117.2C189.6 114.7 190 111.8 190 108.7C189.9 105.7 189.4 102.3 188.5 98.9C187.6 95.4 186.2 91.7 184.3 88.1C182.4 84.5 180.1 80.8 177.2 77.2C174.4 73.7 171.1 70.1 167.3 66.8C163.6 63.5 159.4 60.3 154.8 57.4C150.2 54.6 145.2 51.9 139.9 49.7C134.6 47.4 128.9 45.5 123 44C117.2 42.6 111 41.5 104.8 40.9C98.6 40.4 92.1 40.2 85.7 40.6C79.4 40.9 72.8 41.8 66.5 43.1C60.2 44.4 53.8 46.2 47.7 48.4C41.6 50.6 35.7 53.3 30 56.4C24.4 59.4 16.7 65 14 66.7';
const HEAD = 'M29 66.5L14 66.7L20.4 53.1';

function LoopArrow({ className }) {
  return (
    <svg viewBox="0 0 210 144" className={className} aria-hidden>
      <g fill="none" stroke="var(--color-pitch)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path className="js-line" d={LOOP} />
        <path className="js-head" d={HEAD} />
      </g>
    </svg>
  );
}

// The phone is the official FPL app on purpose: FPL Rush runs on your real
// fantasy team, so the first thing to understand is "link your team".
// landing.png stays exactly as it is.
export function PhoneCallout({ gw, className }) {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ delay: 0.3 })
          .from('.js-stage', { scale: 0.4, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)' })
          .from('.js-phone', { y: 70, rotate: -7, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, '-=0.45')
          .from('.js-note', { y: 16, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, '-=0.7')
          .from('.js-line', { drawSVG: 0, duration: 1.3, ease: 'power1.inOut' }, '-=0.2')
          .from('.js-head', { drawSVG: 0, duration: 0.25, ease: 'power1.out' });
        gsap.to('.js-float', { y: -10, rotate: 0.6, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={cn('relative', className)}>
      {/* The stage — flat: it's a surface, not a button */}
      <span className="js-stage absolute left-[4%] top-[14%] aspect-square w-[56%] rounded-full border-2 border-edge bg-night-2 md:w-[60%]" aria-hidden />
      <div className="js-float relative mr-auto w-[66%] max-w-[360px] md:w-[74%] md:max-w-[480px]">
        <img
          src="/landing.png"
          alt="تطبيق فانتازي البريميرليج على الهاتف"
          width="1653"
          height="1653"
          className="js-phone -ml-3 block h-auto w-full drop-shadow-[0_14px_18px_rgba(0,0,0,.35)]"
        />
      </div>
      <div className="absolute right-0 top-[3%] flex w-[48%] flex-col items-end">
        <p className="js-note font-display text-[clamp(16px,4.6vw,23px)] font-semibold leading-[1.6] text-white">
          عندك فريق في الفانتازي؟ اربطه وابدأ من <Gw n={gw} className="text-pitch" />
        </p>
        <LoopArrow className="mt-1 w-[92%] max-w-[210px] overflow-visible" />
      </div>
    </div>
  );
}
