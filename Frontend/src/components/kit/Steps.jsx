import { cn } from '@/lib/cn';

// Where you are in a flow: one bar per step, filled from the right as you go.
// Flat on purpose — it's a reading, not a control.
export function Steps({ steps, current, className }) {
  return (
    <ol className={cn('grid gap-2', className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'next';
        return (
          <li key={label} aria-current={state === 'now' ? 'step' : undefined}>
            <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className={cn(
                  'block h-full origin-right rounded-full bg-pitch transition-transform duration-500 ease-out',
                  state === 'next' ? 'scale-x-0' : 'scale-x-100',
                )}
              />
            </span>
            <span
              className={cn(
                'mt-2 block truncate font-display text-[12.5px]',
                state === 'now' ? 'font-bold text-white' : state === 'done' ? 'font-medium text-pitch' : 'font-medium text-white/35',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
