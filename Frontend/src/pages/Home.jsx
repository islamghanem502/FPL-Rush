import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useMyChallenges, usePrefetchChallenge } from '@/hooks/useChallenges';
import { useCountUp } from '@/hooks/useCountUp';
import { fmt, fmtRank, gwRange } from '@/lib/format';
import { isFplLinked, FPL_TEAM_URL } from '@/lib/challenge';
import { AppPage } from '@/components/layout/AppPage';
import { Button, TextLink } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Gw } from '@/components/kit/Gw';
import { GwTrack } from '@/components/kit/GwTrack';
import { PageTitle, SectionHead } from '@/components/kit/Heading';
import { Skeleton } from '@/components/kit/Feedback';
import { ArrowIcon, ExternalIcon, LiveBars, ShirtIcon } from '@/components/kit/icons';
import { PitchLines } from '@/components/art/PitchLines';
import { EmptyNet } from '@/components/art/EmptyNet';

// Counts up from 0 once the screen opens (and on every change after).
const useArrival = (value) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return useCountUp(ready ? value : 0, 900);
};

// Not linked yet: the only thing to do is link. Keep it to one action.
function LinkFplPrompt() {
  return (
    <AppPage narrow>
      <PageTitle kicker="أهلاً يا بطل" title="خطوة واحدة وتبدأ" sub="اربط فريقك من الفانتازي عشان نحسب نقاطك ونفتحلك التحديات. محتاجين رقم فريقك (FPL ID) بس." />
      <Button size="lg" knob full to="/register">اربط فريقك</Button>
    </AppPage>
  );
}

// Your team, on your patch of pitch: the one "you" surface of the screen.
function TeamCard({ me }) {
  const points = useArrival(Number(me.lastGwPoints || 0));
  return (
    <section className="mowed relative overflow-hidden rounded-box border-2 border-edge text-edge" style={{ '--band': '46px' }}>
      <PitchLines className="opacity-60" />
      <div className="relative flex flex-col gap-6 p-5 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-display text-[13px] font-semibold text-edge/65">
            <ShirtIcon size={16} strokeWidth={2.4} />
            فريقك
          </div>
          <div className="mt-1 truncate text-right font-display text-[26px] font-extrabold leading-tight md:text-[36px]" dir="auto">{me.teamName || '—'}</div>
          <div dir="ltr" className="mt-1 text-right font-display text-[13px] font-semibold text-edge/60">ID {me.fpl_id}</div>
        </div>
        <div className="shrink-0">
          <div className="font-display text-[13.5px] font-semibold text-edge/65">نقاط <Gw n={me.currentEvent} /></div>
          <div dir="ltr" className="text-right font-display text-[68px] font-extrabold leading-[.9] tabular-nums md:text-[96px]">{fmt(points)}</div>
        </div>
      </div>
      <dl className="relative grid grid-cols-3 border-t-2 border-edge bg-pitch-deep">
        {[
          ['إجمالي النقاط', fmt(me.totalPoints || 0)],
          ['الترتيب العام', fmtRank(me.overallRank)],
          ['بدأت من', `GW ${me.startedEvent || 1}`],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 border-s-2 border-edge/15 px-3 py-3 first:border-s-0 md:px-8 md:py-4">
            <dt className="truncate text-[12px] text-edge/65 md:text-[13px]">{label}</dt>
            <dd dir="ltr" className="mt-0.5 truncate text-right font-display text-[16px] font-extrabold tabular-nums md:text-[22px]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RunningRow({ challenge }) {
  const prefetch = usePrefetchChallenge();
  const warm = () => prefetch(challenge._id);
  return (
    <li>
      <Link
        to={`/challenge/${challenge._id}`}
        onMouseEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        className="group flex items-center gap-3.5 rounded-[18px] px-3 py-3 transition-colors hover:bg-white/[.04] md:px-4"
      >
        <Crest src={challenge.image} title={challenge.title} size={46} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15.5px] font-bold">{challenge.title}</div>
          <div className="mt-0.5 text-[12.5px] text-white/50">
            {fmt(challenge.participantCount || 0)} مشارك · {challenge.isOwner ? 'تحديك' : 'منضم'}
          </div>
        </div>
        <span dir="ltr" className="hidden shrink-0 font-display text-[13px] font-semibold text-white/45 sm:block">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
        <ArrowIcon size={17} className="shrink-0 text-white/35 transition-[translate,color] group-hover:-translate-x-1 group-hover:text-pitch" />
      </Link>
    </li>
  );
}

export default function Home() {
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: mine, isPending: minePending } = useMyChallenges();

  if (!isFplLinked(me)) return <LinkFplPrompt />;

  const currentGw = gw || me.currentEvent;
  const privateCount = (mine?.owned?.length || 0) + (mine?.joined?.length || 0);
  const running = [...(mine?.owned || []), ...(mine?.joined || [])].filter((c) => c.status === 'active').slice(0, 3);

  return (
    <AppPage>
      <PageTitle
        kicker="أهلاً يا بطل"
        title={<span dir="auto" className="block truncate text-right">{me.managerName || me.teamName || 'Manager'}</span>}
        sub={<>مستعد لتحديات <Gw n={currentGw} className="text-white" />؟</>}
      />

      <div className="flex flex-col gap-4">
        <TeamCard me={me} />
        <div className="flex items-center gap-4 px-1">
          <span className="shrink-0 font-display text-[12.5px] font-semibold text-white/45">الموسم</span>
          <GwTrack start={1} end={38} current={currentGw} labels={false} className="min-w-0 flex-1" />
          <span dir="ltr" className="shrink-0 font-display text-[12.5px] font-semibold text-white/45">{currentGw || '—'}/38</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <Button size="lg" knob to="/challenges" className="col-span-2 md:col-span-1">
          شوف تحديات <Gw n={currentGw} />
        </Button>
        <Button variant="secondary" size="lg" to="/challenges?f=mine">
          تحدياتي
          {privateCount > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/10 px-1.5 text-[12.5px] tabular-nums">{fmt(privateCount)}</span>}
        </Button>
        <Button variant="secondary" size="lg" href={FPL_TEAM_URL}>
          تشكيلتي
          <ExternalIcon size={15} className="text-white/50" />
        </Button>
      </div>

      <section>
        <SectionHead title="تحدياتك الجارية" aside={running.length > 0 && <TextLink to="/challenges?f=mine" className="text-[13.5px]">عرض الكل</TextLink>} />
        {minePending ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-[70px]" />)}
          </div>
        ) : running.length > 0 ? (
          <ul className="rounded-box bg-night-2 p-1.5 ring-1 ring-white/[.06]">
            {running.map((c) => <RunningRow key={c._id} challenge={c} />)}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-5 rounded-box bg-night-2 px-5 py-6 ring-1 ring-white/[.06] md:flex-row md:gap-8 md:px-8">
            <EmptyNet className="w-[180px] shrink-0" />
            <div className="text-center md:text-start">
              <div className="font-display text-[18px] font-bold">مفيش تحدي شغال ليك دلوقتي</div>
              <p className="mt-1.5 text-[14px] leading-[1.75] text-white/55">اعمل تحدي لأصحابك في دقيقة، أو ادخل واحد من التحديات العامة.</p>
              <div className="mt-4">
                <Button variant="secondary" to="/challenges/new">اعمل تحدي لأصحابك</Button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col items-stretch gap-4 border-t border-white/[.08] pt-7 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-[20px] font-extrabold md:text-[24px]">
            بونص <Gw n={currentGw} className="text-pitch" />، أول بأول
          </h2>
          <p className="mt-1.5 text-[14px] leading-[1.75] text-white/55">نقاط البونص لكل ماتش في الجولة بتتحدّث مباشرة.</p>
        </div>
        <Button variant="secondary" size="lg" knob to="/bonus" className="w-full shrink-0 md:w-auto">
          <LiveBars className="text-pitch" />
          تابع بونص اللاعبين
        </Button>
      </section>
    </AppPage>
  );
}
