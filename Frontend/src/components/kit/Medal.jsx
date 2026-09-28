import { cn } from '@/lib/cn';

// A finishing position. The top three wear knobs — first is pitch, second is
// white, third is night — everyone else is a plain number.
const TOP = {
  1: 'bg-pitch text-edge',
  2: 'bg-white text-edge',
  3: 'bg-night-3 text-white',
};

export function Medal({ rank, size = 32, className }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.44) };
  if (TOP[rank]) {
    return (
      <span style={style} className={cn('grid shrink-0 place-items-center rounded-full border-2 border-edge font-display font-extrabold leading-none tabular-nums', TOP[rank], className)}>
        {rank}
      </span>
    );
  }
  return (
    <span style={style} className={cn('grid shrink-0 place-items-center font-display font-bold leading-none tabular-nums text-white/50', className)}>
      {rank ?? '—'}
    </span>
  );
}

export const PLACE = { 1: 'المركز الأول', 2: 'المركز الثاني', 3: 'المركز الثالث' };
