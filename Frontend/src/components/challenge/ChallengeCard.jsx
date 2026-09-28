import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { challengeState, STATE_LABEL } from '@/lib/challenge';
import { fmt, gwRange } from '@/lib/format';
import { usePrefetchChallenge } from '@/hooks/useChallenges';
import { Crest } from '@/components/kit/Crest';
import { Gw } from '@/components/kit/Gw';
import { Tag } from '@/components/kit/Tag';
import { GwTrack, trackStatus } from '@/components/kit/GwTrack';
import { ArrowIcon, LockIcon, TrophyIcon, UsersIcon } from '@/components/kit/icons';

export function StateTag({ state, startEvent }) {
  if (state === 'live') return <Tag tone="live">{STATE_LABEL.live}</Tag>;
  if (state === 'upcoming') return <Tag>يبدأ في <Gw n={startEvent} /></Tag>;
  if (state === 'closing') return <Tag>{STATE_LABEL.closing}</Tag>;
  return <Tag tone="ghost">{STATE_LABEL[state]}</Tag>;
}

const CTA = {
  live: 'دخول التحدي',
  upcoming: 'احجز مقعدك',
  closing: 'شوف الترتيب',
  finished: 'شوف تتويج الأبطال',
  cancelled: 'التفاصيل',
};

// The whole card opens the challenge, so its "button" is the card's own
// pressable face: it lifts with the card on hover and sinks when pressed.
// `featured` gives a live card the screen's one pitch button.
export function ChallengeCard({ challenge, currentGw, featured = false, role }) {
  const prefetch = usePrefetchChallenge();
  const state = challengeState(challenge, currentGw);
  const finished = state === 'finished';
  const myFinal = challenge.myParticipant?.finalNetPoints;
  const primary = featured && state === 'live';
  const warm = () => prefetch(challenge._id);

  return (
    <Link
      to={`/challenge/${challenge._id}`}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      className="group flex h-full flex-col rounded-box bg-night-2 p-4 ring-1 ring-white/[.06] transition-[box-shadow] duration-200 hover:ring-white/15 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white md:p-5"
    >
      <div className="flex items-start gap-3.5">
        <Crest src={challenge.image} title={challenge.title} size={finished ? 50 : 60} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StateTag state={state} startEvent={challenge.startEvent} />
            {challenge.visibility === 'private' && (
              <Tag tone="ghost" icon={<LockIcon size={12} strokeWidth={2.8} />}>{role === 'owner' ? 'تحديك' : 'خاص'}</Tag>
            )}
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-[18px] font-bold leading-snug md:text-[19px]">{challenge.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon size={15} strokeWidth={2.2} />
              {fmt(challenge.participantCount || 0)} مشارك
            </span>
            {challenge.minTotalPoints > 0 && <span>يتطلب +{fmt(challenge.minTotalPoints)} نقطة</span>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <GwTrack start={challenge.startEvent} end={challenge.endEvent} current={currentGw} finished={finished} labels={false} />
        <div className="mt-2 flex items-center justify-between gap-3 text-[12.5px]">
          <span className={state === 'live' ? 'text-white/85' : 'text-white/50'}>
            {state === 'cancelled' ? STATE_LABEL.cancelled : trackStatus({ start: challenge.startEvent, end: challenge.endEvent, current: currentGw, finished })}
          </span>
          <span dir="ltr" className="font-display font-semibold text-white/45">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
        </div>
      </div>

      {finished && myFinal !== null && myFinal !== undefined ? (
        <div className="mt-4 flex items-center justify-between rounded-[16px] bg-white/[.04] px-4 py-3">
          <span className="text-[13.5px] text-white/65">نقاطك في التحدي</span>
          <span dir="ltr" className="font-display text-[20px] font-extrabold tabular-nums">{fmt(myFinal)}</span>
        </div>
      ) : challenge.prize ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-[16px] bg-white/[.04] px-4 py-3 text-[13.5px]">
          <TrophyIcon size={17} className="shrink-0 text-pitch" />
          <span className="shrink-0 text-white/50">الأول:</span>
          <span className="min-w-0 truncate font-semibold">{challenge.prize}</span>
        </div>
      ) : null}

      <span className="mt-auto block pt-4">
        <span
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-full border-2 border-edge pe-2 ps-5 font-display text-[15px] font-bold shadow-hard transition-[translate,box-shadow] duration-150 group-active:translate-y-[3px] group-active:shadow-hard-sm md:group-hover:-translate-y-0.5 md:group-hover:shadow-hard-lg',
            primary ? 'bg-pitch text-edge' : 'bg-night-3 text-white',
          )}
        >
          {CTA[state]}
          <span className="knob grid size-8 place-items-center text-edge transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-x-1">
            <ArrowIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}
