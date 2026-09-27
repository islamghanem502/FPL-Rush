import { cn } from '@/lib/cn';

// Native range input (keyboard + screen readers for free) in kit clothes —
// see `.kit-range` in styles.css. The pitch fill follows `--fill`.
export function Slider({ value, min = 0, max = 100, step = 1, onChange, className, ...props }) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('kit-range', className)}
      style={{ '--fill': `${fill}%` }}
      {...props}
    />
  );
}
