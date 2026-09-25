import { cn } from '@/lib/cn';
import { Avatar } from './Misc';

// Your row in any table: a black strip with your name in yellow. Appears
// once per screen, always with a reason to keep going (gap / percentile).
export function NameStrip({ rank, name, reason, value, user, className }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[30px_auto_1fr_auto] items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-canvas',
        className,
      )}
    >
      <div className="num text-center text-[16px] text-brand">{rank ?? '—'}</div>
      <Avatar user={user} size={32} className="ring-2 ring-brand" />
      <div className="min-w-0">
        <div className="jersey truncate text-right text-[16px] text-brand">{name} — أنت</div>
        {reason && <div className="text-[11.5px] font-semibold">{reason}</div>}
      </div>
      <div className="num text-[21px]">{value ?? '—'}</div>
    </div>
  );
}
