import { cn } from '@/lib/cn';

// A row of filters. Chosen = a raised pitch pill (it's "on"); the rest sit
// flat in the track. Scrolls sideways on phones instead of wrapping.
export function FilterChips({ value, onChange, options, label, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-2 border-edge px-4 font-display text-[14px] font-semibold transition-[background-color,color,box-shadow,translate] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white',
              active ? 'bg-pitch text-edge shadow-hard-sm' : 'bg-night-3 text-white/70 hover:text-white',
            )}
          >
            {option.label}
            {option.count > 0 && (
              <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-bold tabular-nums', active ? 'bg-edge text-pitch' : 'bg-white/10 text-white')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Big pressable tiles for a small set of choices (start gameweek, duration).
// `top` is the small line above the main value.
export function ChoiceTiles({ value, onChange, options, label, columns = options.length, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-2.5', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'press flex h-[68px] min-w-0 cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-edge px-1 font-display leading-none',
              active ? 'bg-pitch text-edge' : 'bg-night-3 text-white',
            )}
          >
            {option.top && <span className={cn('text-[11.5px] font-semibold', active ? 'text-edge/70' : 'text-white/45')} dir="ltr">{option.top}</span>}
            <span className={cn('font-extrabold', option.top ? 'mt-1.5 truncate text-[22px] tabular-nums' : 'px-0.5 text-center text-[13px] leading-[1.35]')}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
