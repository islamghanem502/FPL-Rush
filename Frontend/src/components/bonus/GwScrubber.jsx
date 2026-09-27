import { Slider } from '@/components/kit/Slider';
import { ArrowIcon } from '@/components/kit/icons';

const FIRST = 1;
const LAST = 38;
const THUMB = 26; // .kit-range thumb width — keeps the "now" mark centred on its GW

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

// The season as a track: drag the knob across 38 gameweeks, or step one at a
// time. The volt tick marks the gameweek being played now.
export function GwScrubber({ value, current, onChange }) {
  const at = (gw) => `calc(${(gw - FIRST) / (LAST - FIRST)} * (100% - ${THUMB}px) + ${THUMB / 2}px)`;
  return (
    <div className="flex items-center gap-3">
      <Step label="الجولة السابقة" flip onClick={() => onChange(Math.max(FIRST, value - 1))} disabled={value <= FIRST} />
      <div className="relative min-w-0 flex-1 pt-3">
        {current && <span className="absolute top-0 size-2 translate-x-1/2 rounded-full bg-volt" style={{ right: at(current) }} aria-hidden />}
        <Slider
          value={value}
          min={FIRST}
          max={LAST}
          onChange={onChange}
          aria-label="اختار الجولة"
          aria-valuetext={`الجولة ${value}`}
        />
        <div className="flex justify-between text-[11.5px] text-white/35" dir="ltr">
          <span>GW {LAST}</span>
          <span>GW {FIRST}</span>
        </div>
      </div>
      <Step label="الجولة التالية" onClick={() => onChange(Math.min(LAST, value + 1))} disabled={value >= LAST} />
    </div>
  );
}
