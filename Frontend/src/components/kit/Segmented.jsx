import { cn } from '@/lib/cn';

// Two or more options on a sunk track; the chosen one is a raised pitch pill
// that slides between them (a switch with labels).
// `disabled` keeps the choice visible but frozen (e.g. after a deadline).
export function Segmented({ value, onChange, options, label, disabled = false, className }) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const width = 100 / options.length;
  return (
    <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} className={cn('relative flex rounded-full border-2 border-edge bg-night-3 p-1', disabled && 'opacity-55', className)}>
      <span
        className="absolute inset-y-1 rounded-full border-2 border-edge bg-pitch shadow-hard-sm transition-[inset-inline-start] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
        style={{ insetInlineStart: `calc(${index * width}% + ${index === 0 ? 4 : 0}px)`, width: `calc(${width}% - 4px)` }}
        aria-hidden
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 h-10 min-w-0 flex-1 cursor-pointer truncate rounded-full px-2 font-display text-[14.5px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-white disabled:cursor-not-allowed',
              active ? 'text-edge' : 'text-white/70 enabled:hover:text-white',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
