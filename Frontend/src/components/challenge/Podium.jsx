import { cn } from '@/lib/cn';
import { fmt, gwRange } from '@/lib/format';
import { Wordmark } from '@/components/layout/Chrome';
import { Avatar } from '@/components/ui/Misc';

// The shareable black poster: three columns, champion in the middle.
// Column order (RTL): 3rd · 1st · 2nd — the design's composition.
const Column = ({ entry, rank }) => {
  const champion = rank === 1;
  const height = { 1: 148, 2: 114, 3: 92 }[rank];
  const base = { 1: 'bg-brand', 2: 'bg-canvas', 3: 'bg-action' }[rank];
  if (!entry) return <div />;
  return (
    <div className="min-w-0 text-center">
      <div className="mb-2 flex justify-center">
        <Avatar user={entry} size={champion ? 56 : 44} className={cn('ring-[3px]', champion ? 'ring-brand' : 'ring-canvas/40')} />
      </div>
      {champion && (
        <div className="num mb-1.5 inline-block rounded-full bg-brand px-2.5 py-1 text-[9.5px] tracking-[.16em] text-ink">CHAMPION</div>
      )}
      <div className={cn('mb-2 rounded-panel border-2 bg-ink px-1.5 py-2', champion ? 'border-brand' : 'border-canvas/30')}>
        <div className={cn('jersey truncate', champion ? 'text-[16px] text-brand' : 'text-[13px] text-canvas')}>{entry.teamName || '—'}</div>
        <div className="truncate text-[10.5px] font-bold text-canvas/80">{entry.managerName}</div>
        <div className={cn('num', champion ? 'text-[26px] text-brand' : rank === 3 ? 'text-[19px] text-action' : 'text-[19px] text-canvas')}>
          {fmt(entry.challengePoints ?? entry.points)}
        </div>
      </div>
      <div style={{ height }} className={cn('flex flex-col items-center justify-between overflow-hidden rounded-t-[6px] pt-2', base)}>
        <div className={cn('num-display leading-none text-ink', champion ? 'text-[64px]' : rank === 2 ? 'text-[46px]' : 'text-[38px]')}>{rank}</div>
        <div className="podium-hatch h-4 w-full" />
      </div>
    </div>
  );
};

export function Podium({ challenge, top3 = [], participants }) {
  const [first, second, third] = top3;
  return (
    <div className="relative overflow-hidden rounded-card bg-ink px-4 pb-5 pt-4 text-canvas">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 68% at 50% -8%, rgba(245,214,35,.17) 0%, rgba(245,214,35,0) 62%)' }}
      />
      <div className="relative flex items-center justify-between">
        <Wordmark className="text-[15px]" />
        <span className="num text-[10.5px] tracking-[.18em] opacity-75">{gwRange(challenge.startEvent, challenge.endEvent)}</span>
      </div>
      <div className="relative mt-3.5 text-center">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-action px-3.5 py-1.5 text-[12px] font-black text-ink">
          <span className="block h-[7px] w-[7px] shrink-0 rounded-full bg-ink" />
          <span className="truncate">أبطال {challenge.title}</span>
        </span>
      </div>
      <div className="relative mt-5 grid grid-cols-[1fr_1.16fr_1fr] items-end gap-2">
        <Column entry={third} rank={3} />
        <Column entry={first} rank={1} />
        <Column entry={second} rank={2} />
      </div>
      <div className="relative mt-4 flex items-center justify-between border-t border-canvas/20 pt-3 text-[11px]">
        <span className="font-bold opacity-70">{fmt(participants)} مشارك</span>
        <span className="mono opacity-70">fplrush.app</span>
      </div>
    </div>
  );
}
