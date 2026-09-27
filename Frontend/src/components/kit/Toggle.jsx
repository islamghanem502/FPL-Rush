import { cn } from '@/lib/cn';

// Switch: pitch when on, mist when off, white knob with a black edge.
// RTL: off rests on the right, on slides to the left.
const SIZES = {
  md: { track: 'h-8 w-14', knob: 'size-[22px]', on: '-translate-x-6' }, // travel 52 − 22 − 6
  sm: { track: 'h-7 w-12', knob: 'size-[18px]', on: '-translate-x-5' }, // travel 44 − 18 − 6
};

export function Toggle({ checked, onChange, id, label, size = 'md', className }) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 cursor-pointer rounded-full border-2 border-edge transition-colors duration-200 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white',
        s.track,
        checked ? 'bg-pitch' : 'bg-mist',
        className,
      )}
    >
      <span
        className={cn(
          'knob absolute right-[3px] top-1/2 -translate-y-1/2 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]',
          s.knob,
          checked && s.on,
        )}
        aria-hidden
      />
    </button>
  );
}
