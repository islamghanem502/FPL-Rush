import { cn } from '@/lib/cn';
import { prizes } from '@/lib/challenge';
import { Medal } from '@/components/kit/Medal';
import { CheckIcon, CloseIcon } from '@/components/kit/icons';

// The join rules as a checklist against *your* team: pitch check = you pass,
// alert cross = this one stops you. Read-only.
export function Eligibility({ checks, className }) {
  return (
    <ul className={cn('grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2', className)}>
      {checks.map((check) => (
        <li key={check.key} className="flex items-center gap-3 rounded-[16px] bg-white/[.04] px-3.5 py-3">
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full border-2 border-edge',
              check.ok ? 'bg-pitch text-edge' : 'bg-night text-alert',
            )}
          >
            {check.ok ? <CheckIcon size={14} strokeWidth={3.2} /> : <CloseIcon size={13} strokeWidth={3.2} />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[12px] text-white/50">{check.label}</div>
            <div className={cn('truncate font-display text-[14.5px] font-bold', !check.ok && 'text-alert')}>{check.value}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const RANK = { 'المركز الأول': 1, 'المركز الثاني': 2, 'المركز الثالث': 3 };

// Prizes, each on the medal of its place.
export function PrizeList({ challenge, className }) {
  const list = prizes(challenge);
  if (!list.length) return null;
  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {list.map(([place, prize]) => (
        <li key={place} className="flex items-center gap-3 rounded-[16px] bg-white/[.04] px-3.5 py-3">
          <Medal rank={RANK[place]} size={30} />
          <div className="min-w-0">
            <div className="text-[12px] text-white/50">{place}</div>
            <div className="break-words font-display text-[15px] font-semibold leading-snug">{prize}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// A ticket: the main face on top, the stub below a perforated line, with the
// notches punched where they meet. `stubHeight` must match the stub's height.
export function Ticket({ children, stub, stubHeight = 84, tone = 'pitch', className }) {
  return (
    <div
      className={cn('ticket relative overflow-hidden rounded-[26px]', tone === 'pitch' ? 'mowed text-edge' : 'bg-night-2 text-white', className)}
      style={{ '--cut': `calc(100% - ${stubHeight}px)`, '--band': '34px' }}
    >
      <div className="relative">{children}</div>
      <div className="relative flex items-center px-5 md:px-6" style={{ height: stubHeight }}>
        <span className={cn('absolute inset-x-6 top-0 border-t-2 border-dashed', tone === 'pitch' ? 'border-edge/35' : 'border-white/15')} aria-hidden />
        {stub}
      </div>
    </div>
  );
}
