import { Link } from 'react-router-dom';
import { challengeState, STATE_LABEL } from '@/lib/challenge';
import { fmt, gwRange } from '@/lib/format';
import { Chip, LiveChip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Logo, PrizeRow } from '@/components/ui/Misc';

export function StateChip({ state, startEvent }) {
  if (state === 'live') return <LiveChip>نشط</LiveChip>;
  if (state === 'upcoming') return <Chip variant="ink">يبدأ في GW {startEvent}</Chip>;
  if (state === 'closing') return <Chip variant="ink">{STATE_LABEL.closing}</Chip>;
  return <Chip variant="outline">{STATE_LABEL[state]}</Chip>;
}

const CTA = {
  live: 'دخول التحدي',
  upcoming: 'احجز مقعدك',
  closing: 'شوف الترتيب',
  finished: 'شوف تتويج الأبطال',
  cancelled: 'التفاصيل',
};

// `featured` gives this card the screen's one primary button.
export function ChallengeCard({ challenge, currentGw, featured = false, role }) {
  const state = challengeState(challenge, currentGw);
  const to = `/challenge/${challenge._id}`;
  const prize = challenge.prize;
  const finished = state === 'finished';
  const myFinal = challenge.myParticipant?.finalNetPoints;

  return (
    <Link to={to} className="block rounded-card bg-paper p-4 text-ink">
      <div className="flex items-start gap-3">
        <Logo src={challenge.image} size={finished ? 52 : 74} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StateChip state={state} startEvent={challenge.startEvent} />
            <Chip variant="gw">{gwRange(challenge.startEvent, challenge.endEvent)}</Chip>
            {challenge.visibility === 'private' && <Chip variant="outline">{role === 'owner' ? 'تحديك' : 'خاص'}</Chip>}
          </div>
          <h3 className="mt-2 truncate text-[18px] font-black leading-snug">{challenge.title}</h3>
          <div className="mt-0.5 text-[12.5px] font-semibold text-muted">
            {fmt(challenge.participantCount || 0)} مشارك
            {challenge.minTotalPoints > 0 && ` · يتطلب +${fmt(challenge.minTotalPoints)} نقطة`}
          </div>
        </div>
      </div>

      {finished && myFinal !== null && myFinal !== undefined ? (
        <div className="mt-3 flex items-center justify-between rounded-chip bg-canvas px-3.5 py-2.5">
          <span className="text-[13px] font-bold">نقاطك في التحدي</span>
          <span className="num text-[19px]">{fmt(myFinal)}</span>
        </div>
      ) : prize ? (
        <PrizeRow place="المركز الأول" prize={prize} className="mt-3" />
      ) : null}

      <Button as="span" variant={featured && state === 'live' ? 'primary' : 'secondary'} full className="mt-3 pointer-events-none">
        {CTA[state]}
      </Button>
    </Link>
  );
}
