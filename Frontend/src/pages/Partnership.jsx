import { useRef } from 'react';
import { copyText } from '@/lib/clipboard';
import { useMe } from '@/hooks/useAuth';
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/motion/gsap';
import { SiteNav } from '@/components/site/SiteNav';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button } from '@/components/kit/Button';
import { CopyIcon, MailIcon } from '@/components/kit/icons';
import { TacticsBoard } from '@/components/art/TacticsBoard';
import { PitchLines } from '@/components/art/PitchLines';

const WRAP = 'mx-auto w-full max-w-[1120px] px-4 md:px-8';
const EMAIL = 'fplrush.official@gmail.com';

const PILLARS = [
  ['تحديات على مقاسك', 'تحديات بتبدأ وتخلص في جولات يحددها الشريك، بشروط دخول واضحة.'],
  ['فلترة صارمة', 'مفيش حسابات وهمية — الدخول بمعايير: الترتيب العام، بداية الحساب، وإجمالي النقاط.'],
  ['جمهور عربي', 'منصة مفتوحة لكل مدربي الفانتازي في الوطن العربي، مع نظام جوائز للمسابقات المحلية.'],
];

export default function Partnership() {
  const { data: me } = useMe();
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.js-word', { yPercent: 110, rotate: 4, duration: 0.7, stagger: 0.07 })
          .from('.js-sub', { y: 16, autoAlpha: 0, duration: 0.6 }, '-=0.35');
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

  const links = me
    ? [
        { label: 'الرئيسية', to: '/home' },
        { label: 'التحديات', to: '/challenges' },
        { label: 'بونص اللاعبين', to: '/bonus' },
      ]
    : [
        { label: 'الرئيسية', to: '/' },
        { label: 'بونص اللاعبين', to: '/bonus' },
        { label: 'الشراكات', to: '/partnership', active: true },
      ];

  // Arabic moves word by word, never letter by letter (the letters join).
  const words = (text) =>
    text.split(' ').map((word, i) => (
      <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
        <span className="js-word inline-block">{word}</span>
        {' '}
      </span>
    ));

  return (
    <div ref={root} className="theme-night min-h-dvh overflow-x-clip">
      <SiteNav
        links={links}
        actions={
          me ? (
            <Button variant="secondary" size="sm" to="/profile">حسابي</Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" to="/login">دخول</Button>
              <span className="hidden md:block"><Button size="sm" to="/register">ابدأ التحدي</Button></span>
            </>
          )
        }
        menuAction={!me && <Button size="lg" knob full to="/register">ابدأ التحدي</Button>}
      />

      <main className={`${WRAP} pt-4 md:pt-12`}>
        <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
          <div>
            <div className="font-display text-[14px] font-semibold text-white/55 md:text-[15px]">شركاء النجاح</div>
            <h1 className="mt-2 font-display text-[34px] font-extrabold leading-[1.2] md:text-[52px]">
              <span className="block">{words('إحنا نحط القواعد،')}</span>
              <span className="block text-pitch">{words('وإنت تحط التشكيلة.')}</span>
            </h1>
            <p className="js-sub mt-4 max-w-[460px] text-[15px] leading-[1.85] text-white/65 md:text-[17px]">
              لو براند أو صانع محتوى أو جروب كبير — بنعملك تحدي فانتازي باسمك، بجولاتك وشروطك وجوائزك، ونتولّى إحنا الحسابات والترتيب.
            </p>
          </div>
          <TacticsBoard className="w-full" />
        </section>

        <section className="mt-16 md:mt-28">
          <h2 className="js-reveal font-display text-[24px] font-extrabold md:text-[36px]">ليه FPL Rush؟</h2>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 md:mt-10 md:grid-cols-3 md:gap-10">
            {PILLARS.map(([title, body]) => (
              <div key={title} className="js-reveal border-t-2 border-edge pt-5 md:pt-6">
                <span className="knob block size-4" aria-hidden />
                <h3 className="mt-4 font-display text-[19px] font-bold md:text-[21px]">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-[1.85] text-white/60">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-4 md:mt-28 md:grid-cols-2">
          <div className="js-reveal mowed relative overflow-hidden rounded-box border-2 border-edge p-6 text-edge md:p-8" style={{ '--band': '48px' }}>
            <PitchLines className="opacity-40" />
            <div className="relative">
              <h2 className="font-display text-[24px] font-extrabold md:text-[30px]">للبراندات</h2>
              <p className="mt-3 max-w-[420px] text-[15px] font-medium leading-[1.85] text-edge/80">
                اربط اسمك بالحماس. قدّم جوائزك لمجتمع الفانتازي واظهر في جولات الحسم.
              </p>
            </div>
          </div>
          <div className="js-reveal rounded-box bg-night-2 p-6 ring-1 ring-white/[.06] md:p-8">
            <h2 className="font-display text-[24px] font-extrabold md:text-[30px]">لصناع المحتوى</h2>
            <p className="mt-3 max-w-[420px] text-[15px] leading-[1.85] text-white/65">
              اعمل تحدي خاص لمتابعينك بشروطك. إحنا علينا الحسابات، وإنت عليك المتعة.
            </p>
          </div>
        </section>

        <section className="js-reveal mt-16 flex flex-col items-stretch gap-5 border-t border-white/[.08] pt-8 md:mt-28 md:flex-row md:items-center md:justify-between md:pt-10">
          <div>
            <h2 className="font-display text-[24px] font-extrabold md:text-[34px]">جاهز نبدأ؟</h2>
            <p className="mt-2 text-[14.5px] leading-[1.8] text-white/60">ابعتلنا وهنرد عليك خلال يوم عمل.</p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:w-[440px]">
            <div className="flex items-center gap-2 rounded-full bg-night-3 p-1.5 ps-5 ring-1 ring-white/[.06]">
              <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-[14px] text-white/80">{EMAIL}</span>
              <Button variant="secondary" size="sm" onClick={() => copyText(EMAIL)}>
                <CopyIcon size={15} />
                انسخ
              </Button>
            </div>
            <Button size="lg" knob full href={`mailto:${EMAIL}`}>
              <MailIcon size={18} />
              ابعتلنا إيميل
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
