import { Slider } from './Slider';
import { ArrowIcon } from './icons';

function Step({ label, onClick, disabled, flip }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="press grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-edge bg-night-3 text-white"
    >
      <ArrowIcon size={17} className={flip ? 'rotate-180' : undefined} />
    </button>
  );
}

// Pick one gameweek between `min` and `max`: drag the knob or step once.
// The chosen GW sits big above the track.
export function GwPicker({ id, label, value, min = 1, max = 38, onChange }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-white/55">{label}</label>
        <span dir="ltr" className="font-display text-[26px] font-extrabold leading-none tabular-nums text-pitch">GW {value}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Step label="الجولة السابقة" flip onClick={() => onChange(clamp(value - 1))} disabled={value <= min} />
        <div className="min-w-0 flex-1">
          <Slider id={id} value={value} min={min} max={max} onChange={(n) => onChange(clamp(n))} aria-valuetext={`GW ${value}`} disabled={min === max} />
          <div className="flex justify-between text-[11.5px] text-white/35" dir="ltr">
            <span>GW {max}</span>
            <span>GW {min}</span>
          </div>
        </div>
        <Step label="الجولة التالية" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} />
      </div>
    </div>
  );
}
