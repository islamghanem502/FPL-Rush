import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState, eligibility, prizes } from '@/lib/challenge';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useEnrollWithInvite, useInvitePreview } from '@/hooks/useChallenges';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card, Divider } from '@/components/ui/Card';
import { Empty, Loading, Logo, PrizeRow } from '@/components/ui/Misc';
import { StateChip } from '@/components/challenge/ChallengeCard';

// Landed here from a private invite link or a typed code.
export default function JoinInvite() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: challenge, isPending, isError } = useInvitePreview(inviteCode);
  const join = useEnrollWithInvite();

  if (isPending) return <><Chrome back="/challenges" title="دعوة خاصة" /><Loading label="جارٍ فحص رابط الدعوة…" /></>;
  if (isError || !challenge) {
    return (
      <>
        <Chrome back="/challenges" title="دعوة خاصة" />
        <Page><Empty number="404" title="رابط الدعوة غير صالح" hint="انتهت صلاحيته أو غيّر صاحب التحدي الكود" action={<Button variant="secondary" to="/challenges">كل التحديات</Button>} /></Page>
      </>
    );
  }

  const state = challengeState(challenge, gw);
  const checks = eligibility(me, challenge);
  const prizeList = prizes(challenge);

  const enroll = () =>
    join.mutate(inviteCode, {
      onSuccess: ({ data }) => { toast.success('انضممت للتحدي'); navigate(`/challenge/${data.challengeId}`, { replace: true }); },
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <>
      <Chrome back="/challenges" title="دعوة خاصة" />
      <Page>
        <Card className="rounded-[24px]">
          <div className="flex items-center gap-3">
            <Logo src={challenge.image} size={54} className="rounded-2xl" />
            <div className="min-w-0">
              <h1 className="text-[22px] font-black leading-tight">{challenge.title}</h1>
              <div className="mt-0.5 text-[13px] font-semibold text-muted"><span className="num font-bold">{gwRange(challenge.startEvent, challenge.endEvent)}</span> · {fmt(challenge.participantCount || 0)} مشارك</div>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <StateChip state={state} startEvent={challenge.startEvent} />
            <Chip variant="outline">خاص · بالدعوة</Chip>
          </div>
          {challenge.description && <><Divider /><p className="whitespace-pre-line text-[15px] font-semibold leading-[1.8]">{challenge.description}</p></>}
          {prizeList.length > 0 && <div className="mt-4 space-y-2">{prizeList.map(([place, prize]) => <PrizeRow key={place} place={place} prize={prize} />)}</div>}
        </Card>

        {!challenge.isJoined && (
          <Card className="mt-3.5">
            <div className="text-[14.5px] font-black">شروط الانضمام</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {checks.map((c) => (
                <div key={c.key} className={cn('rounded-panel border px-3 py-2.5', c.ok ? 'border-line-strong' : 'border-action')}>
                  <div className="text-[11px] font-bold text-muted">{c.label}</div>
                  <div className={cn('mt-0.5 text-[13.5px] font-black', !c.ok && 'text-action')}>{c.value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="mt-5">
          {challenge.isJoined ? (
            <Button size="lg" full to={`/challenge/${challenge._id}`}>أنت منضم بالفعل — فتح التحدي</Button>
          ) : (
            <Button size="lg" full disabled={!challenge.canJoin} loading={join.isPending} onClick={enroll}>
              {challenge.canJoin ? 'الانضمام إلى التحدي' : 'لا تطابق شروط الانضمام'}
            </Button>
          )}
          <p className="mt-3 text-center text-[12px] font-semibold text-muted">النقاط تُحسب من الجولة التي تنضم فيها حتى GW {challenge.endEvent}.</p>
        </div>
      </Page>
    </>
  );
}
