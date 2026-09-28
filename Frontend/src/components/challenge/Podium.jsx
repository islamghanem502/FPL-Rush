import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { fmt, gwRange } from '@/lib/format';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { confetti } from '@/motion/confetti';
import { Avatar } from '@/components/kit/Avatar';
import { Wordmark } from '@/components/site/Wordmark';

// The crown sits on the champion — pitch, with the black edge.
const Crown = () => (
  <svg viewBox="0 0 48 32" className="js-crown mx-auto mb-1 w-9" aria-hidden>
    <path d="M5 27 3 8l12 9 9-14 9 14 12-9-2 19Z" fill="var(--color-pitch)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="24" cy="18" r="3.5" fill="#fff" stroke="#000" strokeWidth="2.5" />
  </svg>
);

// First is a mowed patch of pitch, second is white, third is night.
const BLOCK = {
  1: 'mowed text-edge h-[150px] md:h-[176px]',
  2: 'bg-white text-edge h-[112px] md:h-[132px]',
  3: 'bg-night-3 text-white h-[86px] md:h-[100px]',
};

const Column = ({ entry, rank }) => {
  const champion = rank === 1;
  if (!entry) return <div />;
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="js-person flex w-full min-w-0 flex-col items-center">
        {champion && <Crown />}
        <Avatar user={entry} size={champion ? 64 : 48} className={champion ? 'ring-4 ring-pitch/30' : undefined} />
        <div className={cn('mt-2 w-full truncate px-1 font-display font-bold', champion ? 'text-[15.5px] md:text-[17px]' : 'text-[13.5px] md:text-[15px]')}>{entry.teamName || '—'}</div>
        <div className="w-full truncate px-1 text-[11.5px] text-white/50">{entry.managerName}</div>
        <div dir="ltr" className={cn('mt-1 font-display font-extrabold tabular-nums', champion ? 'text-[24px] text-pitch' : 'text-[18px]')}>
          {fmt(entry.challengePoints ?? entry.points)}
        </div>
      </div>
      <div
        style={{ '--band': '16px' }}
        className={cn('js-block mt-3 flex w-full origin-bottom items-start justify-center rounded-t-[18px] border-2 border-b-0 border-edge pt-2', BLOCK[rank])}
      >
        <span className={cn('font-display font-extrabold leading-none tabular-nums', champion ? 'text-[56px]' : 'text-[40px]')}>{rank}</span>
      </div>
    </div>
  );
};

// The shareable stage: three blocks, champion in the middle, crowned. The
// blocks rise, the people land on them, then one burst of confetti.
// Column order (RTL): 3rd · 1st · 2nd.
export function Podium({ challenge, top3 = [], participants }) {
  const [first, second, third] = top3;
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ delay: 0.25 })
          .from('.js-block', { scaleY: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.4)' })
          .from('.js-person', { y: -40, autoAlpha: 0, duration: 0.5, stagger: 0.1, ease: 'bounce.out' }, '-=0.25')
          .from('.js-crown', { y: -30, rotate: -25, autoAlpha: 0, duration: 0.5, ease: 'back.out(2.5)' }, '-=0.1')
          .call(() => confetti(root.current, { origin: 0.3 }));
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative overflow-hidden rounded-box bg-night-2 px-3 pt-4 ring-1 ring-white/[.06] md:px-8 md:pt-6">
      <div className="flex items-center justify-between gap-3 px-1">
        <Wordmark />
        <span dir="ltr" className="font-display text-[12.5px] font-semibold tracking-wide text-white/45">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
      </div>
      <div className="mt-5 px-1 text-center">
        <div className="text-[13px] text-white/55">أبطال التحدي</div>
        <h1 className="mt-1 font-display text-[24px] font-extrabold leading-snug md:text-[32px]">{challenge.title}</h1>
      </div>
      <div className="mt-6 grid grid-cols-[1fr_1.18fr_1fr] items-end gap-2 md:mx-auto md:max-w-[560px] md:gap-4">
        <Column entry={third} rank={3} />
        <Column entry={first} rank={1} />
        <Column entry={second} rank={2} />
      </div>
      <div className="-mx-3 flex items-center justify-between border-t-2 border-edge bg-night px-4 py-3 text-[12.5px] text-white/50 md:-mx-8 md:px-8">
        <span>{fmt(participants)} مشارك</span>
        <span dir="ltr" className="font-display font-semibold">fplrush.app</span>
      </div>
    </div>
  );
}
