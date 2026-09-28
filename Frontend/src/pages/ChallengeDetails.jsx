import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState, eligibility, prizes, FPL_TEAM_URL } from '@/lib/challenge';
import { copyText } from '@/lib/clipboard';
import { useMe } from '@/hooks/useAuth';
import { useArmed } from '@/hooks/useArmed';
import { useCurrentGw } from '@/hooks/useBonus';
import { useChallenge, useEnroll, useInvite, useStandings } from '@/hooks/useChallenges';
import { AppPage } from '@/components/layout/AppPage';
import { Avatar } from '@/components/kit/Avatar';
import { Button, TextLink } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Empty, Loader, Notice, PageLoader } from '@/components/kit/Feedback';
import { GwTrack, trackStatus } from '@/components/kit/GwTrack';
import { SectionHead } from '@/components/kit/Heading';
import { Panel } from '@/components/kit/Panel';
import { Tag } from '@/components/kit/Tag';
import { EditIcon, ExternalIcon, LockIcon, ShareIcon, UsersIcon } from '@/components/kit/icons';
import { EmptyNet } from '@/components/art/EmptyNet';
import { VarScreen } from '@/components/art/VarScreen';
import { StateTag } from '@/components/challenge/ChallengeCard';
import { Standings, rankOf } from '@/components/challenge/Standings';
import { Podium } from '@/components/challenge/Podium';
import { InviteBox } from '@/components/challenge/InviteBox';
import { OwnerMode } from '@/components/challenge/OwnerMode';
import { Eligibility, PrizeList } from '@/components/challenge/Parts';

// Joining locks your baseline — ask for a second tap instead of a modal.
// While armed, a bar drains to show how long the second tap stays open.
function JoinButton({ challenge, eligible }) {
  const enroll = useEnroll();
  const [armed, setArmed] = useArmed();

  if (!eligible) return <Button size="lg" full disabled>فريقك مش مطابق للشروط</Button>;

  const join = () => {
    if (!armed) return setArmed(true);
    enroll.mutate(challenge._id, {
      onSuccess: () => toast.success('انضممت للتحدي — بالتوفيق'),
      onError: (e) => { toast.error(errorMessage(e)); setArmed(false); },
    });
  };
  return (
    <div>
      <Button size="lg" knob full loading={enroll.isPending} onClick={join}>{armed ? 'اضغط تاني للتأكيد' : 'انضم للتحدي'}</Button>
      {armed && (
        <div className="mt-3 animate-fadein">
          <span className="block h-1 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full origin-right animate-drain rounded-full bg-pitch" />
          </span>
          <p className="mt-2.5 text-center text-[13px] leading-relaxed text-white/60">النقاط بتتحسب من الجولة دي، ومفيش رجوع بعد الانضمام.</p>
        </div>
      )}
    </div>
  );
}

function Hero({ challenge, state, gw }) {
  const hasBanner = Boolean(challenge.backgroundImage);
  const hasBody = challenge.description || challenge.descriptionLinks?.length > 0 || prizes(challenge).length > 0;
  return (
    <section className="overflow-hidden rounded-box bg-night-2 ring-1 ring-white/[.06]">
      {hasBanner && (
        <div className="duotone-pitch h-32 md:h-44"><img src={challenge.backgroundImage} alt="" /></div>
      )}
      <div className="p-5 md:p-7">
        <div className="flex items-start gap-4">
          <Crest src={challenge.image} title={challenge.title} size={68} className={cn('relative', hasBanner && '-mt-12 md:-mt-14')} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <StateTag state={state} startEvent={challenge.startEvent} />
              {challenge.visibility === 'private' && <Tag tone="ghost" icon={<LockIcon size={12} strokeWidth={2.8} />}>خاص · بالرابط بس</Tag>}
              {challenge.isOwner && <Tag tone="pitch">تحديك</Tag>}
            </div>
            <h1 className="mt-2.5 font-display text-[24px] font-extrabold leading-snug md:text-[34px]">{challenge.title}</h1>
            <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-white/55">
              <UsersIcon size={15} strokeWidth={2.2} />
              {fmt(challenge.participantCount || 0)} مشارك
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-night p-4">
          <div className="mb-3 flex items-center justify-between gap-3 text-[13px]">
            <span className="text-white/80">{trackStatus({ start: challenge.startEvent, end: challenge.endEvent, current: gw })}</span>
            <span dir="ltr" className="font-display font-semibold text-white/45">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
          </div>
          <GwTrack start={challenge.startEvent} end={challenge.endEvent} current={gw} labels={false} />
        </div>

        {hasBody && (
          <div className="mt-5 flex flex-col gap-4 border-t border-white/[.06] pt-5">
            {challenge.description && <p className="whitespace-pre-line text-[15px] leading-[1.9] text-white/80">{challenge.description}</p>}
            {challenge.descriptionLinks?.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {challenge.descriptionLinks.map((link, i) => (
                  <TextLink key={i} href={link.url} className="inline-flex items-center gap-1.5">
                    {link.label || link.url}
                    <ExternalIcon size={14} />
                  </TextLink>
                ))}
              </div>
            )}
            <PrizeList challenge={challenge} />
          </div>
        )}
      </div>
    </section>
  );
}

// You, in the race: your patch of pitch with your rank and points.
function MyPosition({ entry, rank, total, started }) {
  return (
    <section className="mowed relative overflow-hidden rounded-box border-2 border-edge p-5 text-edge" style={{ '--band': '40px' }}>
      <div className="flex items-center gap-3">
        <Avatar user={entry} size={48} light />
        <div className="min-w-0">
          <div className="font-display text-[12.5px] font-semibold text-edge/65">أنت في المنافسة</div>
          <div className="truncate text-right font-display text-[19px] font-extrabold" dir="auto">{entry.teamName}</div>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-edge/[.08] px-4 py-3">
          <dt className="text-[12px] text-edge/65">ترتيبك</dt>
          <dd className="mt-0.5 flex items-baseline gap-1.5">
            <span dir="ltr" className="font-display text-[30px] font-extrabold leading-none tabular-nums">{started ? `#${rank}` : '—'}</span>
            <span className="text-[12.5px] text-edge/60">من {fmt(total)}</span>
          </dd>
        </div>
        <div className="rounded-[16px] bg-edge/[.08] px-4 py-3">
          <dt className="text-[12px] text-edge/65">نقاطك</dt>
          <dd dir="ltr" className="mt-0.5 text-right font-display text-[30px] font-extrabold leading-none tabular-nums">{started ? fmt(entry.challengePoints ?? 0) : '—'}</dd>
        </div>
      </dl>
    </section>
  );
}

function OwnerPanel({ challenge, gw }) {
  const { data: invite } = useInvite(challenge._id, true);
  const beforeStart = !gw || Number(gw) < Number(challenge.startEvent);
  const canEdit = challenge.status === 'active' && beforeStart && !(challenge.participantCount > 0);
  const lockedMode = challenge.status !== 'active' || (gw && Number(gw) > Number(challenge.startEvent));
  return (
    <Panel className="flex flex-col gap-5">
      <InviteBox challenge={challenge} invite={invite} />
      <div className="h-px bg-white/[.06]" />
      <OwnerMode challenge={challenge} locked={lockedMode} />
      {canEdit && (
        <div className="flex justify-center border-t border-white/[.06] pt-4">
          <TextLink to={`/challenges/${challenge._id}/edit`} className="inline-flex items-center gap-2">
            <EditIcon size={15} />
            عدّل التحدي
          </TextLink>
        </div>
      )}
    </Panel>
  );
}

// ── Live / upcoming / closing ────────────────────────────────────────────────
function LiveView({ challenge, standings, standingsPending, standingsFetching, me, gw }) {
  const state = challengeState(challenge, gw);
  const started = state !== 'upcoming';
  const meIndex = standings.findIndex((s) => s.userId === String(me?._id));
  const mine = meIndex >= 0 ? { entry: standings[meIndex], rank: rankOf(standings[meIndex], meIndex) } : null;
  const checks = eligibility(me, challenge);
  const eligible = checks.every((c) => c.ok);
  const canJoinHere = !challenge.isJoined && challenge.visibility === 'public' && challenge.status === 'active';
  const inviteOnly = !challenge.isJoined && challenge.visibility === 'private' && !challenge.isOwner;
  const owner = challenge.isOwner && challenge.visibility === 'private';
  const lineup = challenge.isJoined && state === 'live';
  const side = mine || canJoinHere || inviteOnly || owner || lineup;

  return (
    <AppPage back="/challenges">
      {/* One grid: phones read hero → your cards → table; desktop puts your
          cards in a sticky column beside the hero and the table. */}
      <div className={cn('grid grid-cols-[minmax(0,1fr)] items-start gap-6 md:gap-8', side && 'md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]')}>
        <div className="min-w-0 md:col-start-1">
          <Hero challenge={challenge} state={state} gw={gw} />
        </div>

        {state === 'closing' && (
          <div className="flex min-w-0 items-center gap-4 rounded-box bg-night-2 p-4 ring-1 ring-white/[.06] md:col-start-1 md:p-5">
            <VarScreen className="w-[88px] shrink-0 md:w-[104px]" />
            <div>
              <div className="font-display text-[16px] font-bold">النتايج بتتراجع</div>
              <p className="mt-1 text-[13.5px] leading-[1.75] text-white/60">الفايزين هيتعلنوا بعد ما FPL يأكد اكتمال الجولة والبونص.</p>
            </div>
          </div>
        )}

        {side && (
          <aside className="flex min-w-0 flex-col gap-4 md:sticky md:top-24 md:col-start-2 md:row-span-3 md:row-start-1">
            <SideCards {...{ challenge, mine, standings, started, state, checks, eligible, canJoinHere, inviteOnly, owner, lineup, gw }} />
          </aside>
        )}

        <section className="min-w-0 md:col-start-1">
          <SectionHead
            title="الترتيب"
            aside={
              state === 'closing' ? <Tag>جارٍ التثبيت</Tag>
              : started ? <Tag tone="live">{standingsFetching ? 'بيتحدّث…' : 'مباشر · كل دقيقة'}</Tag>
              : <Tag>الحساب يبدأ مع GW {challenge.startEvent}</Tag>
            }
          />
          {standingsPending ? (
            <Loader label="جارٍ تحميل الترتيب…" className="py-10" />
          ) : (
            <Standings
              standings={standings}
              meId={me?._id}
              pending={state === 'closing' ? 'في انتظار تثبيت النتائج' : 'النقاط تُحسب مع أول جولة'}
              emptyHint={challenge.isOwner ? 'ابعت رابط الدعوة وابدأ المنافسة' : undefined}
            />
          )}
        </section>
      </div>
    </AppPage>
  );
}

// What *you* can do here — beside the table on desktop, above it on phones.
function SideCards({ challenge, mine, standings, started, state, checks, eligible, canJoinHere, inviteOnly, owner, lineup, gw }) {
  return (
    <>
      {mine && <MyPosition entry={mine.entry} rank={mine.rank} total={standings.length} started={started && state !== 'closing'} />}

      {lineup && (
        <Button size="lg" knob full href={FPL_TEAM_URL}>اضبط تشكيلتك</Button>
      )}

      {canJoinHere && (
        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[17px] font-bold">شروط الانضمام</h2>
            {eligible && <Tag tone="pitch">فريقك مطابق</Tag>}
          </div>
          <Eligibility checks={checks} className="sm:grid-cols-1" />
          <JoinButton challenge={challenge} eligible={eligible} />
        </Panel>
      )}

      {inviteOnly && <Notice icon={<LockIcon size={16} />}>الانضمام للتحدي ده برابط الدعوة بس — اطلبه من صاحب التحدي.</Notice>}

      {owner && <OwnerPanel challenge={challenge} gw={gw} />}
    </>
  );
}

// ── Finished ─────────────────────────────────────────────────────────────────
function ChampionsView({ challenge, standings, me }) {
  const ranked = standings.map((entry, index) => ({ ...entry, rank: rankOf(entry, index) })).sort((a, b) => a.rank - b.rank);
  const top3 = ranked.length ? ranked.slice(0, 3) : (challenge.winners || []).map((w) => ({ ...w, challengePoints: w.points }));
  const url = window.location.href;

  const share = async () => {
    const champion = top3[0];
    const text = `أبطال ${challenge.title} على FPL Rush — البطل: ${champion?.teamName || '—'} بـ ${fmt(champion?.challengePoints)} نقطة`;
    if (navigator.share) {
      try { await navigator.share({ title: challenge.title, text, url }); return; } catch { /* cancelled */ }
    }
    copyText(`${text}\n${url}`);
  };

  return (
    <AppPage back="/challenges">
      <div className="flex flex-col gap-4">
        {top3.length ? (
          <Podium challenge={challenge} top3={top3} participants={standings.length || challenge.participantCount} />
        ) : (
          <Empty art={<EmptyNet />} title="التحدي خلص من غير مشاركين" />
        )}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 md:mx-auto md:w-full md:max-w-[560px]">
          <Button size="lg" onClick={share}>
            <ShareIcon size={17} />
            شارك النتيجة
          </Button>
          <Button variant="secondary" size="lg" to="/challenges">التحدي الجاي</Button>
        </div>
      </div>

      {prizes(challenge).length > 0 && (
        <section>
          <SectionHead title="الجوائز" />
          <PrizeList challenge={challenge} className="md:grid md:grid-cols-3" />
        </section>
      )}

      {ranked.length > 3 && (
        <section>
          <SectionHead title="بقية الترتيب" aside={<span dir="ltr" className="font-display font-semibold">4 — {fmt(ranked.length)}</span>} />
          <Standings standings={standings} meId={me?._id} from={4} />
        </section>
      )}
      {ranked.length > 0 && ranked.length <= 3 && (
        <section>
          <SectionHead title="الترتيب النهائي" aside={`${fmt(ranked.length)} مشارك`} />
          <Standings standings={standings} meId={me?._id} />
        </section>
      )}
    </AppPage>
  );
}

export default function ChallengeDetails() {
  const { id } = useParams();
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: challenge, isPending, isError } = useChallenge(id);
  const { data: standings = [], isPending: standingsPending, isFetching: standingsFetching } = useStandings(id, challenge?.status);

  if (isPending) return <AppPage back="/challenges"><PageLoader label="جارٍ فتح التحدي…" /></AppPage>;
  if (isError || !challenge) {
    return (
      <AppPage back="/challenges" narrow>
        <Empty
          art={<EmptyNet />}
          title="التحدي مش موجود"
          hint="أو معندكش صلاحية تشوفه"
          action={<Button variant="secondary" to="/challenges">كل التحديات</Button>}
        />
      </AppPage>
    );
  }

  const state = challengeState(challenge, gw);
  return state === 'finished'
    ? <ChampionsView challenge={challenge} standings={standings} me={me} />
    : <LiveView challenge={challenge} standings={standings} standingsPending={standingsPending} standingsFetching={standingsFetching} me={me} gw={gw} />;
}
