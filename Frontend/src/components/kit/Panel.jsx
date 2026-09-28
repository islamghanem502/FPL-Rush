import { cn } from '@/lib/cn';

// Passing your own `p-*` replaces the default padding (no class fights).
const ownPadding = (className = '') => /(^|\s)p-/.test(className);

// A static surface: flat night-2 with a hairline. Never a hard shadow — the
// edge + hard shadow belong to things you can press, so surfaces stay flat
// and buttons read as buttons.
export function Panel({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-box bg-night-2 ring-1 ring-white/[.06]', !ownPadding(className) && 'p-5', className)} {...props}>
      {children}
    </Tag>
  );
}
