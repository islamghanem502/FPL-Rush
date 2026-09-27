import { cn } from '@/lib/cn';

// The GW number, Latin and tight — used inline inside Arabic sentences.
export const Gw = ({ n, className }) => (
  <span dir="ltr" className={cn('font-display font-bold whitespace-nowrap tabular-nums', className)}>
    GW {n ?? '—'}
  </span>
);
