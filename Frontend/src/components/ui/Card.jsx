import { cn } from '@/lib/cn';

// White = information. Ink = authority. Radius 20 (24 for the hero card).
export function Card({ tone = 'paper', as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-card p-4',
        tone === 'ink' ? 'bg-ink text-canvas' : 'bg-paper text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export const Divider = ({ className }) => <div className={cn('my-4 h-px bg-line', className)} />;

// Section title with an optional trailing note (count, hint, chip)
export function SectionTitle({ children, aside, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[16px] font-black">{children}</h2>
      {aside && <div className="text-[12.5px] font-semibold text-muted">{aside}</div>}
    </div>
  );
}
