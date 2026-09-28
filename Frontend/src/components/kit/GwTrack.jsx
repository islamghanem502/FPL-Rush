import { cn } from '@/lib/cn';
import { gameweeks } from '@/lib/format';

// A run of gameweeks read as a strip of cells, right → left (RTL): played in
// pitch, the one being played now in volt, the rest waiting. A reading, not a
// control — flat, no knob (a knob would promise you can drag it).
//   start/end — the gameweeks covered; current — the live FPL gameweek
//   finished  — fill everything (the challenge is over)
export function GwTrack({ start, end, current, finished = false, labels = true, className }) {
  const from = Number(start) || 1;
  const to = Math.max(from, Number(end) || from);
  const now = Number(current) || 0;
  const cells = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const dense = cells.length > 14;

  return (
    <div className={className}>
      <div className={cn('flex items-end', dense ? 'gap-[3px]' : 'gap-1.5')} aria-hidden>
        {cells.map((gw) => {
          const state = finished || gw < now ? 'done' : gw === now ? 'now' : 'next';
          return (
            <span
              key={gw}
              className={cn(
                'block min-w-0 flex-1 rounded-full transition-colors duration-500',
                dense ? 'h-2.5' : 'h-3',
                state === 'done' && 'bg-pitch',
                state === 'now' && (dense ? 'h-4 bg-volt' : 'h-4.5 bg-volt'),
                state === 'next' && 'bg-white/10',
              )}
            />
          );
        })}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between font-display text-[11.5px] font-medium text-white/40">
          <span dir="ltr">GW {from}</span>
          {cells.length > 1 && <span dir="ltr">GW {to}</span>}
        </div>
      )}
    </div>
  );
}

// Where a challenge stands on its own track, in words.
export const trackStatus = ({ start, end, current, finished }) => {
  const from = Number(start);
  const to = Number(end);
  const now = Number(current) || 0;
  const total = to - from + 1;
  if (finished || now > to) return `اتلعبت ${gameweeks(total)}`;
  if (!now) return `يبدأ مع GW ${from}`;
  if (now < from) return from - now === 1 ? 'يبدأ الجولة الجاية' : `يبدأ بعد ${gameweeks(from - now)}`;
  return `الجولة ${now - from + 1} من ${total}`;
};
