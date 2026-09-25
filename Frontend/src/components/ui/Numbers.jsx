import { cn } from '@/lib/cn';
import { fmt } from '@/lib/format';
import { useCountUp } from '@/hooks/useCountUp';

// A number lives on a panel — never floating. The panel is sharper (8px)
// than the card that holds it. Ink panel = your own numbers, in yellow.
export function NumberPanel({ label, value, tone = 'ink', animate = true, format = fmt, className }) {
  const shown = useCountUp(animate && typeof value === 'number' ? value : 0);
  const display = animate && typeof value === 'number' ? format(shown) : format(value);
  return (
    <div
      className={cn(
        'rounded-panel px-4 py-3.5',
        tone === 'ink' ? 'bg-ink text-canvas' : 'bg-paper text-ink',
        className,
      )}
    >
      <div className="text-[11.5px] font-bold opacity-90">{label}</div>
      <div className={cn('num-display mt-0.5 text-[36px] leading-[1.1] text-right', tone === 'ink' ? 'text-brand' : 'text-ink')}>
        {display}
      </div>
    </div>
  );
}

// Position circle: first is yellow, the rest are cream.
export function RankCircle({ rank, size = 28, className }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'num flex shrink-0 items-center justify-center rounded-full text-[14px] text-ink',
        rank === 1 ? 'bg-brand' : 'bg-canvas',
        className,
      )}
    >
      {rank}
    </div>
  );
}

// Small stacked "14 / من 312" tile used inside strips and history rows
export function RankTile({ value, sub, tone = 'brand', className }) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-panel px-3 py-1.5 text-center',
        tone === 'brand' && 'bg-brand text-ink',
        tone === 'outline' && 'border-2 border-ink text-ink',
        tone === 'outlineDark' && 'border-2 border-canvas text-canvas',
        className,
      )}
    >
      <div className="num text-[18px] leading-none">{value}</div>
      {sub && <div className="mt-0.5 text-[9.5px] font-extrabold">{sub}</div>}
    </div>
  );
}
