import { useState } from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

// People are round with the black edge. The photo in full colour; without
// one, initials — on pitch when it's you, on night-3 for everyone else.
// `light` = sitting on a pitch surface: a white knob instead.
export function Avatar({ user, size = 40, you = false, light = false, className }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  const photo = user?.avatar && !broken;
  return (
    <span
      style={photo ? style : { ...style, fontSize: Math.max(11, Math.round(size * 0.36)) }}
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-edge font-display font-bold leading-none',
        photo ? 'bg-night-3' : light ? 'bg-white text-edge' : you ? 'bg-pitch text-edge' : 'bg-night-3 text-white',
        className,
      )}
    >
      {photo ? (
        <img src={user.avatar} alt="" loading="lazy" onError={() => setBroken(true)} className="size-full object-cover" />
      ) : (
        <span dir="auto">{initials(user?.managerName || user?.teamName || user?.email)}</span>
      )}
    </span>
  );
}
