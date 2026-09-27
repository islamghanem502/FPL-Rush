import { cn } from '@/lib/cn';

// A static surface: flat night-2 with a hairline. Never a hard shadow — the
// edge + hard shadow belong to things you can press, so surfaces stay flat
// and buttons read as buttons.
export function Panel({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-box bg-night-2 p-5 ring-1 ring-white/[.06]', className)} {...props}>
      {children}
    </Tag>
  );
}
