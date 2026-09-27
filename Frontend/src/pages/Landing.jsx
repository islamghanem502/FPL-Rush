import { lazy, Suspense, useRef, useState } from 'react';
import { useCurrentGw } from '@/hooks/useBonus';
import { gsap, ScrollTrigger, useGSAP, MOTION_OK, prefersReducedMotion } from '@/motion/gsap';
import { HEADLINE, aspect } from '@/motion/scenes/specs';
import { SiteNav } from '@/components/site/SiteNav';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button } from '@/components/kit/Button';
import { Gw } from '@/components/kit/Gw';
import { LiveBars } from '@/components/kit/icons';
import { PhoneCallout } from '@/components/landing/PhoneCallout';
import { Ticker } from '@/components/landing/Ticker';
import { PlayModes } from '@/components/landing/PlayModes';

// Remotion is only fetched by the landing, and only after first paint.
const HeroHeadline = lazy(() => import('@/components/landing/HeroHeadline'));

const WRAP = 'mx-auto w-full max-w-[1120px] px-4 md:px-8';

export default function Landing() {
  const { data: gw } = useCurrentGw();
  const [mode, setMode] = useState('public');
  const root = useRef(null);

  // Nav → the two ways to play: pick the mode, then scroll to it.
  const showMode = (next) => {
    setMode(next);
    document.getElementById('play')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const links = [
    { label: 'التحديات العامة', onClick: () => showMode('public') },
    { label: 'تحدي لأصحابك', onClick: () => showMode('private') },
    { label: 'بونص اللاعبين', to: '/bonus' },
    { label: 'الشراكات', to: '/partnership' },
  ];

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.js-sub', { y: 18, autoAlpha: 0, duration: 0.7 }, 0.9)
          .from('.js-cta > *', { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.09, ease: 'back.out(1.7)' }, 1.05);

        gsap.set('.js-reveal', { y: 36, autoAlpha: 0 });
        ScrollTrigger.batch('.js-reveal', {
          start: 'top 85%',
          once: true,
          onEnter: (items) => gsap.to(items, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }),
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="theme-night min-h-dvh overflow-x-clip">
      <SiteNav
        animate
        links={links}
        actions={
          <>
            <Button variant="secondary" size="sm" to="/login">دخول</Button>
            {/* The phone menu carries this one */}
            <span className="hidden md:block">
              <Button size="sm" to="/register">ابدأ التحدي</Button>
            </span>
          </>
        }
        menuAction={<Button size="lg" knob full to="/register">ابدأ التحدي</Button>}
      />

      {/* Hero — phones: one column in reading order; desktop: text | phone */}
      <section className={`${WRAP} grid gap-x-12 pt-4 md:grid-cols-[1.05fr_1fr] md:grid-rows-[1fr_auto_auto_auto_1fr] md:pt-8`}>
        <h1 className="sr-only">جمعت كام نقطة؟</h1>
        <div className="w-full max-w-[560px] md:col-start-1 md:row-start-2" style={{ aspectRatio: aspect(HEADLINE) }} aria-hidden>
          <Suspense fallback={null}>
            <HeroHeadline />
          </Suspense>
        </div>

        <p className="js-sub mt-5 max-w-[470px] text-[15px] leading-[1.8] text-white/70 md:col-start-1 md:row-start-3 md:text-[18px]">
          اربط فريقك من فانتازي البريميرليج، وادخل تحديات عامة أو اعمل تحدي لأصحابك — بجولات محددة، وترتيب مباشر، والمهارة وحدها اللي بتحسم.
        </p>

        <PhoneCallout gw={gw} className="mt-6 md:col-start-2 md:row-span-5 md:row-start-1 md:mt-0 md:self-center" />

        <div className="js-cta mt-4 grid gap-3 md:col-start-1 md:row-start-4 md:mt-8 md:flex md:flex-wrap">
          <Button size="lg" knob to="/register">ابدأ التحدي</Button>
          <Button size="lg" variant="secondary" to="/login">
            شوف كل تحديات <Gw n={gw} />
          </Button>
        </div>
      </section>

      <Ticker />

      {/* The two ways to play */}
      <section id="play" className={`${WRAP} scroll-mt-24`}>
        <PlayModes gw={gw} mode={mode} onMode={setMode} />
      </section>

      {/* Bonus — public, no account needed */}
      <section className={`${WRAP} mt-14 md:mt-32`}>
        <div className="js-reveal flex flex-col items-stretch gap-5 border-t border-white/[.08] pt-8 md:flex-row md:items-center md:justify-between md:pt-10">
          <div>
            <h2 className="font-display text-[22px] font-extrabold leading-snug md:text-[34px]">
              بونص <Gw n={gw} className="text-pitch" />، أول بأول
            </h2>
            <p className="mt-2 max-w-[460px] text-[14.5px] leading-[1.8] text-white/65 md:text-[15.5px]">
              نقاط البونص لكل مباراة في الجولة الحالية بتتحدّث مباشرة — ومن غير تسجيل.
            </p>
          </div>
          <Button variant="secondary" size="lg" knob to="/bonus" className="w-full shrink-0 md:w-auto">
            <LiveBars className="text-pitch" />
            تابع بونص اللاعبين
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
