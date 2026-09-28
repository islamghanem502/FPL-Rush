import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState, eligibility, prizes } from '@/lib/challenge';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useEnrollWithInvite, useInvitePreview } from '@/hooks/useChallenges';
import { AppPage } from '@/components/layout/AppPage';
import { Button } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Empty, PageLoader } from '@/components/kit/Feedback';
import { PageTitle } from '@/components/kit/Heading';
import { Panel } from '@/components/kit/Panel';
import { Tag } from '@/components/kit/Tag';
import { LockIcon, UsersIcon } from '@/components/kit/icons';
import { TornTicket } from '@/components/art/TornTicket';
import { StateTag } from '@/components/challenge/ChallengeCard';
import { Eligibility, PrizeList, Ticket } from '@/components/challenge/Parts';

// Landed here from a private invite link or a typed code.
export default function JoinInvite() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: challenge, isPending, isError } = useInvitePreview(inviteCode);
  const join = useEnrollWithInvite();

  if (isPending) return <AppPage back="/challenges" narrow><PageLoader label="بنفحص رابط الدعوة…" /></AppPage>;
  if (isError || !challenge) {
    return (
      <AppPage back="/challenges" narrow>
        <Empty
          art={<TornTicket />}
          title="رابط الدعوة مش شغال"
          hint="صلاحيته خلصت، أو صاحب التحدي غيّر الكود. اطلب منه الرابط الجديد."
          action={<Button variant="secondary" to="/challenges">كل التحديات</Button>}
        />
      </AppPage>
    );
  }

  const state = challengeState(challenge, gw);
  const checks = eligibility(me, challenge);
  const hasPrizes = prizes(challenge).length > 0;

  const enroll = () =>
    join.mutate(inviteCode, {
      onSuccess: ({ data }) => { toast.success('انضممت للتحدي'); navigate(`/challenge/${data.challengeId}`, { replace: true }); },
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <AppPage back="/challenges" narrow>
      <PageTitle kicker="دعوة خاصة" title="اتعزمت على تحدي" sub="حد من أصحابك بعتلك دعوة — شوف التفاصيل وادخل بفريقك." />

      <Ticket
        stubHeight={72}
        stub={
          <div className="flex w-full items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-bold text-edge/70">
              <LockIcon size={14} />
              خاص · بالدعوة
            </span>
            <span dir="ltr" className="font-display text-[17px] font-extrabold">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
          </div>
        }
      >
        <div className="flex items-center gap-4 p-5 pb-6 md:p-6">
          <Crest src={challenge.image} title={challenge.title} size={64} />
          <div className="min-w-0">
            <h2 className="font-display text-[23px] font-extrabold leading-snug md:text-[28px]">{challenge.title}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-edge/65">
              <UsersIcon size={15} strokeWidth={2.4} />
              {fmt(challenge.participantCount || 0)} مشارك
            </div>
          </div>
        </div>
      </Ticket>

      {(challenge.description || hasPrizes) && (
        <Panel className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <StateTag state={state} startEvent={challenge.startEvent} />
          </div>
          {challenge.description && <p className="whitespace-pre-line text-[15px] leading-[1.9] text-white/80">{challenge.description}</p>}
          <PrizeList challenge={challenge} />
        </Panel>
      )}

      {!challenge.isJoined && (
        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[17px] font-bold">شروط الانضمام</h2>
            {challenge.canJoin && <Tag tone="pitch">فريقك مطابق</Tag>}
          </div>
          <Eligibility checks={checks} />
        </Panel>
      )}

      <div className="flex flex-col gap-3">
        {challenge.isJoined ? (
          <Button size="lg" knob full to={`/challenge/${challenge._id}`}>أنت منضم بالفعل — افتح التحدي</Button>
        ) : (
          <Button size="lg" knob={challenge.canJoin} full disabled={!challenge.canJoin} loading={join.isPending} onClick={enroll}>
            {challenge.canJoin ? 'انضم للتحدي' : 'فريقك مش مطابق للشروط'}
          </Button>
        )}
        <p className="text-center text-[13px] leading-relaxed text-white/50">النقاط بتتحسب من الجولة اللي بتنضم فيها لحد GW {challenge.endEvent}.</p>
      </div>
    </AppPage>
  );
}
