import { cn } from '@/lib/cn';

// The top of an app screen: a small line of context, the title, one sentence.
export function PageTitle({ kicker, title, sub, aside, className }) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {kicker && <div className="font-display text-[14px] font-semibold text-white/55 md:text-[15px]">{kicker}</div>}
        <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.25] md:text-[42px]">{title}</h1>
        {sub && <p className="mt-2 max-w-[560px] text-[14.5px] leading-[1.8] text-white/65 md:text-[15.5px]">{sub}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export function SectionHead({ title, aside, className }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="font-display text-[18px] font-bold md:text-[21px]">{title}</h2>
      {aside && <div className="flex shrink-0 items-center gap-2 text-[13px] text-white/55">{aside}</div>}
    </div>
  );
}

// A number with its label. Flat — numbers are read, not pressed.
export function Stat({ label, value, className, valueClassName }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate text-[12.5px] text-current opacity-60">{label}</div>
      <div dir="ltr" className={cn('mt-0.5 text-right font-display text-[22px] font-extrabold leading-tight tabular-nums md:text-[26px]', valueClassName)}>
        {value}
      </div>
    </div>
  );
}
