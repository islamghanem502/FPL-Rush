import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState, eligibility, prizes, FPL_TEAM_URL } from '@/lib/challenge';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useChallenge, useEnroll, useInvite, useStandings } from '@/hooks/useChallenges';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip, LiveChip } from '@/components/ui/Chip';
import { Card, Divider, SectionTitle } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Field';
import { RankTile } from '@/components/ui/Numbers';
import { Avatar, Empty, Loading, Logo, PrizeRow } from '@/components/ui/Misc';
import { StateChip } from '@/components/challenge/ChallengeCard';
import { Standings, rankOf } from '@/components/challenge/Standings';
import { Podium } from '@/components/challenge/Podium';
import { InviteBox, copyText } from '@/components/challenge/InviteBox';
import { OwnerMode } from '@/components/challenge/OwnerMode';

// Joining locks your baseline — ask for a second tap instead of a modal.
function JoinButton({ challenge, eligible }) {
  const enroll = useEnroll();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!eligible) return <Button size="lg" full disabled>لا تطابق شروط الانضمام</Button>;

  const join = () => {
    if (!armed) return setArmed(true);
    enroll.mutate(challenge._id, {
      onSuccess: () => toast.success('انضممت للتحدي — بالتوفيق'),
      onError: (e) => { toast.error(errorMessage(e)); setArmed(false); },
    });
  };
  return (
    <div>
      <Button size="lg" full loading={enroll.isPending} onClick={join}>{armed ? 'اضغط تاني للتأكيد' : 'انضم للتحدي'}</Button>
      {armed && <p className="mt-2 text-center text-[12px] font-semibold text-muted">النقاط تُحسب من هذه الجولة ولا يمكن التراجع بعد الانضمام.</p>}
    </div>
  );
}

function Hero({ challenge, state }) {
  const prizeList = prizes(challenge);
  return (
    <Card className="overflow-hidden rounded-[24px] p-0">
      {challenge.backgroundImage && (
        <div className="duotone h-28"><img src={challenge.backgroundImage} alt="" /></div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Logo src={challenge.image} size={54} className="rounded-2xl" />
          <div className="min-w-0">
            <h1 className="text-[22px] font-black leading-tight">{challenge.title}</h1>
            <div className="mt-0.5 text-[13px] font-semibold text-muted">
              <span className="num font-bold">{gwRange(challenge.startEvent, challenge.endEvent)}</span> · {fmt(challenge.participantCount || 0)} مشارك
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <StateChip state={state} startEvent={challenge.startEvent} />
          {challenge.visibility === 'private' && <Chip variant="outline">خاص · بالرابط فقط</Chip>}
          {challenge.isOwner && <Chip variant="brand">تحديك</Chip>}
        </div>
        {(challenge.description || challenge.descriptionLinks?.length > 0 || prizeList.length > 0) && <Divider />}
        {challenge.description && <p className="whitespace-pre-line text-[15px] font-semibold leading-[1.8]">{challenge.description}</p>}
        {challenge.descriptionLinks?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {challenge.descriptionLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className="rounded-full border-2 border-ink px-3.5 py-1.5 text-[12.5px] font-extrabold">
                {link.label || link.url} ↗
              </a>
            ))}
          </div>
        )}
        {prizeList.length > 0 && (
          <div className={cn('space-y-2', (challenge.description || challenge.descriptionLinks?.length) && 'mt-4')}>
            {prizeList.map(([place, prize]) => <PrizeRow key={place} place={place} prize={prize} />)}
          </div>
        )}
      </div>
    </Card>
  );
}

function MyPosition({ entry, rank, total, started }) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[22px] bg-ink px-4 py-3.5 text-canvas">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={entry} size={44} className="ring-2 ring-brand" />
        <div className="min-w-0">
          <div className="text-[11.5px] font-bold text-live">أنت في المنافسة</div>
          <div className="jersey truncate text-right text-[22px] leading-tight text-brand">{entry.teamName}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RankTile value={started ? rank : '—'} sub={`من ${fmt(total)}`} />
        <RankTile tone="outlineDark" value={started ? entry.challengePoints ?? 0 : '—'} sub="نقطة" />
      </div>
    </div>
  );
}

function OwnerPanel({ challenge, gw }) {
  const { data: invite } = useInvite(challenge._id, true);
  const beforeStart = !gw || Number(gw) < Number(challenge.startEvent);
  const canEdit = challenge.status === 'active' && beforeStart && !(challenge.participantCount > 0);
  const lockedMode = challenge.status !== 'active' || (gw && Number(gw) > Number(challenge.startEvent));
  return (
    <Card className="mt-3.5 space-y-4">
      <InviteBox challenge={challenge} invite={invite} />
      <OwnerMode challenge={challenge} locked={lockedMode} />
      {canEdit && (
        <div className="flex justify-center gap-2 border-t border-line pt-3">
          <Button variant="tertiary" size="sm" to={`/challenges/${challenge._id}/edit`}>تعديل التحدي</Button>
        </div>
      )}
    </Card>
  );
}

// ── Live / upcoming / closing ────────────────────────────────────────────────
function LiveView({ challenge, standings, standingsPending, me, gw }) {
  const state = challengeState(challenge, gw);
  const started = state !== 'upcoming';
  const meIndex = standings.findIndex((s) => s.userId === String(me?._id));
  const mine = meIndex >= 0 ? { entry: standings[meIndex], rank: rankOf(standings[meIndex], meIndex) } : null;
  const checks = eligibility(me, challenge);
  const eligible = checks.every((c) => c.ok);
  const canJoinHere = !challenge.isJoined && challenge.visibility === 'public' && challenge.status === 'active';

  return (
    <>
      <Chrome back="/challenges" title="التحدي" />
      <Page>
        <Hero challenge={challenge} state={state} />

        {mine && <MyPosition entry={mine.entry} rank={mine.rank} total={standings.length} started={started && state !== 'closing'} />}

        {state === 'closing' && (
          <Notice className="mt-3.5">جارٍ تثبيت النتائج النهائية — الفائزون يُعلنون بعد ما يؤكد FPL اكتمال الجولة والبونص.</Notice>
        )}

        {canJoinHere && (
          <Card className="mt-3.5">
            <SectionTitle aside={eligible ? <Chip variant="live">مطابق</Chip> : null}>شروط الانضمام</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {checks.map((c) => (
                <div key={c.key} className={cn('rounded-panel border px-3 py-2.5', c.ok ? 'border-line-strong' : 'border-action')}>
                  <div className="text-[11px] font-bold text-muted">{c.label}</div>
                  <div className={cn('mt-0.5 text-[13.5px] font-black', !c.ok && 'text-action')}>{c.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4"><JoinButton challenge={challenge} eligible={eligible} /></div>
          </Card>
        )}

        {!challenge.isJoined && challenge.visibility === 'private' && !challenge.isOwner && (
          <Notice className="mt-3.5">الانضمام لهذا التحدي برابط الدعوة فقط — اطلبه من صاحب التحدي.</Notice>
        )}

        {challenge.isOwner && challenge.visibility === 'private' && <OwnerPanel challenge={challenge} gw={gw} />}

        <section className="mt-6">
          <SectionTitle aside={state === 'closing' ? <Chip variant="ink">جارٍ التثبيت</Chip> : started ? <LiveChip>مباشر · كل دقيقة</LiveChip> : <Chip variant="ink">يبدأ الحساب مع GW {challenge.startEvent}</Chip>}>
            الترتيب
          </SectionTitle>
          {standingsPending ? <Loading label="جارٍ تحميل الترتيب…" /> : (
            <Standings standings={standings} meId={me?._id} pending={state === 'closing' ? 'في انتظار تثبيت النتائج' : 'النقاط تُحسب مع أول جولة'} emptyHint={challenge.isOwner ? 'شارك رابط الدعوة وابدأ المنافسة' : undefined} />
          )}
        </section>

        {challenge.isJoined && state === 'live' && (
          <div className="mt-6"><Button size="lg" full href={FPL_TEAM_URL}>اضبط تشكيلتك</Button></div>
        )}
      </Page>
    </>
  );
}

// ── Finished ─────────────────────────────────────────────────────────────────
function ChampionsView({ challenge, standings, me }) {
  const ranked = standings.map((entry, index) => ({ ...entry, rank: rankOf(entry, index) })).sort((a, b) => a.rank - b.rank);
  const top3 = ranked.length ? ranked.slice(0, 3) : (challenge.winners || []).map((w) => ({ ...w, challengePoints: w.points }));
  const prizeList = prizes(challenge);
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
    <>
      <Chrome back="/challenges" title="تتويج الأبطال" right={<Chip variant="dark">انتهى</Chip>} />
      <Page>
        {top3.length ? <Podium challenge={challenge} top3={top3} participants={standings.length || challenge.participantCount} /> : (
          <Empty number="0" title="انتهى التحدي بدون مشاركين" />
        )}
        <div className="mt-3.5 flex gap-2.5">
          <Button variant="brand" size="lg" className="flex-1" onClick={share}>شارك النتيجة</Button>
          <Button variant="secondary" size="lg" to="/challenges">التحدي القادم</Button>
        </div>

        {prizeList.length > 0 && (
          <section className="mt-6">
            <SectionTitle>الجوائز</SectionTitle>
            <div className="space-y-2">{prizeList.map(([place, prize]) => <PrizeRow key={place} place={place} prize={prize} />)}</div>
          </section>
        )}

        {ranked.length > 3 && (
          <section className="mt-6">
            <SectionTitle aside={`4 — ${fmt(ranked.length)}`}>بقية الترتيب</SectionTitle>
            <Standings standings={standings} meId={me?._id} from={4} />
          </section>
        )}
        {ranked.length > 0 && ranked.length <= 3 && (
          <section className="mt-6">
            <SectionTitle aside={`${fmt(ranked.length)} مشارك`}>الترتيب النهائي</SectionTitle>
            <Standings standings={standings} meId={me?._id} />
          </section>
        )}
      </Page>
    </>
  );
}

export default function ChallengeDetails() {
  const { id } = useParams();
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: challenge, isPending, isError } = useChallenge(id);
  const { data: standings = [], isPending: standingsPending } = useStandings(id, challenge?.status);

  if (isPending) return <><Chrome back="/challenges" title="التحدي" /><Loading /></>;
  if (isError || !challenge) {
    return (
      <>
        <Chrome back="/challenges" title="التحدي" />
        <Page><Empty number="404" title="التحدي غير موجود" hint="أو لا تملك صلاحية الوصول إليه" action={<Button variant="secondary" to="/challenges">كل التحديات</Button>} /></Page>
      </>
    );
  }

  const state = challengeState(challenge, gw);
  return state === 'finished'
    ? <ChampionsView challenge={challenge} standings={standings} me={me} />
    : <LiveView challenge={challenge} standings={standings} standingsPending={standingsPending} me={me} gw={gw} />;
}
