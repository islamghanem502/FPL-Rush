import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { dayLabel, time } from '@/lib/format';
import { useMe } from '@/hooks/useAuth';
import { useBootstrap, useCurrentGw, useLiveBonus } from '@/hooks/useBonus';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { SiteNav } from '@/components/site/SiteNav';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button } from '@/components/kit/Button';
import { Panel } from '@/components/kit/Panel';
import { GwScrubber } from '@/components/bonus/GwScrubber';
import { FixtureCard } from '@/components/bonus/FixtureCard';

const WRAP = 'mx-auto w-full max-w-[1120px] px-4 md:px-8';

// The scrubber moves instantly; the request waits until it settles.
const useSettled = (value, delay = 250) => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return settled;
};

// One line of broadcast-style counts for the round — all from the feed.
function RoundLine({ fixtures }) {
  const live = fixtures.filter((f) => f.status === 'live').length;
  const done = fixtures.filter((f) => f.status === 'finished').length;
  const cells = [
    ['مباريات', fixtures.length],
    ['انتهت', done],
    ['جارية', live, live > 0],
  ];
  return (
    <dl className="grid grid-cols-3 rounded-box bg-night-2 ring-1 ring-white/[.06] md:max-w-[560px]">
      {cells.map(([label, n, hot]) => (
        <div key={label} className="border-s border-white/[.08] px-4 py-3 first:border-s-0 md:py-3.5">
          <dt className="text-[12px] text-white/45">{label}</dt>
          <dd className={cn('mt-0.5 font-display text-[20px] font-extrabold tabular-nums md:text-[24px]', hot && 'text-volt')}>{n}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Bonus() {
  const { data: me } = useMe();
  const { data: currentGw } = useCurrentGw();
  const { data: bootstrap } = useBootstrap();
  const [picked, setPicked] = useState(null);
  const shown = picked ?? currentGw ?? null;
  const gw = useSettled(shown);
  const { data, isPending, isError, dataUpdatedAt } = useLiveBonus(gw);
  const root = useRef(null);

  const teams = bootstrap?.teams || {};
  const players = bootstrap?.players || {};
  const fixtures = useMemo(() => data?.fixtures || [], [data]);
  const anyLive = fixtures.some((f) => f.status === 'live');
  const days = useMemo(() => {
    const byDay = new Map();
    fixtures.forEach((f) => {
      const key = dayLabel(f.kickoff_time);
      byDay.set(key, [...(byDay.get(key) || []), f]);
    });
    return [...byDay.entries()];
  }, [fixtures]);

  const relation = !currentGw || !shown ? '' : shown === currentGw ? 'الجولة الحالية' : shown < currentGw ? 'جولة فاتت' : 'جولة جاية';

  // The big number turns over when you move; cards and bars arrive with data.
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.js-gw', { yPercent: 40, autoAlpha: 0, duration: 0.35, ease: 'power3.out' });
      });
    },
    { scope: root, dependencies: [shown], revertOnUpdate: true },
  );
  useGSAP(
    () => {
      if (!data) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.js-fixture', { y: 24, autoAlpha: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
      });
    },
    { scope: root, dependencies: [data?.event], revertOnUpdate: true },
  );

  const links = me
    ? [
        { label: 'الرئيسية', to: '/home' },
        { label: 'التحديات', to: '/challenges' },
        { label: 'بونص اللاعبين', to: '/bonus', active: true },
      ]
    : [
        { label: 'الرئيسية', to: '/' },
        { label: 'بونص اللاعبين', to: '/bonus', active: true },
        { label: 'الشراكات', to: '/partnership' },
      ];

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

      <main className={`${WRAP} pt-4 md:pt-10`}>
        <div className="grid items-end gap-6 md:grid-cols-[1fr_minmax(0,460px)] md:gap-12">
          <div>
            <h1 className="font-display text-[14px] font-semibold text-white/60 md:text-[15px]">بونص اللاعبين</h1>
            <div className="mt-1 flex items-end gap-4">
              <div className="overflow-hidden pb-1">
                <div dir="ltr" className="js-gw font-display text-[56px] font-extrabold leading-[.95] tabular-nums md:text-[96px]">
                  GW {shown ? String(shown).padStart(2, '0') : '—'}
                </div>
              </div>
              {relation && <span className={cn('mb-2.5 text-[13px] md:mb-3 md:text-[14px]', shown === currentGw ? 'text-volt' : 'text-white/50')}>{relation}</span>}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-white/60 md:text-[14px]">
              {anyLive ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-volt" aria-hidden />
                  مباريات جارية — بيتحدّث كل دقيقة لوحده
                </>
              ) : dataUpdatedAt ? (
                `آخر تحديث ${time(new Date(dataUpdatedAt).toISOString())}`
              ) : null}
            </p>
          </div>
          {shown && <GwScrubber value={shown} current={currentGw} onChange={setPicked} />}
        </div>

        {data?.stale && (
          <p className="mt-6 text-[13.5px] text-white/55">موقع الفانتازي بطيء دلوقتي — اللي قدامك من آخر تحديث نجح.</p>
        )}

        <div className="mt-8">
          {isPending && !data && (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-box bg-night-2" />)}
            </div>
          )}

          {isError && !data && (
            <Panel className="py-10 text-center">
              <div className="font-display text-[20px] font-bold">مش قادرين نجيب بيانات الجولة</div>
              <p className="mt-2 text-[14px] text-white/55">موقع الفانتازي مش بيرد دلوقتي — جرّب كمان شوية.</p>
            </Panel>
          )}

          {data && fixtures.length === 0 && (
            <Panel className="py-10 text-center">
              <div className="font-display text-[20px] font-bold">مفيش مباريات في الجولة دي</div>
            </Panel>
          )}

          {fixtures.length > 0 && <RoundLine fixtures={fixtures} />}

          {days.map(([day, list]) => (
            <section key={day} className="mt-10">
              <h2 className="flex items-center gap-3 font-display text-[15px] font-semibold text-white/70">
                {day}
                <span className="h-px flex-1 bg-white/[.08]" />
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {list.map((f) => (
                  <FixtureCard key={f.id} fixture={f} teams={teams} players={players} />
                ))}
              </div>
            </section>
          ))}
        </div>
        {fixtures.length > 0 && (
          <p className="mt-8 text-[12.5px] leading-relaxed text-white/40">
            البونص أثناء الماتش متوقع وبيتغير لحد صافرة النهاية — وبعدها بيتأكد رسميًا.
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
