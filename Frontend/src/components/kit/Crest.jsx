import { useState } from 'react';
import { cn } from '@/lib/cn';

// Most titles open with the same word ("تحدي الشلة", "تحدي الشغل"), so the
// badge letter comes from the first word that tells them apart, without "ال".
const GENERIC = new Set(['تحدي', 'دوري', 'كأس', 'بطولة', 'مسابقة', 'challenge', 'league', 'cup', 'the']);
const badgeLetter = (title) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const word = words.find((w) => !GENERIC.has(w.toLowerCase())) || words[0] || 'F';
  const bare = word.length > 3 && word.startsWith('ال') ? word.slice(2) : word;
  return [...bare][0].toUpperCase();
};

// A challenge's badge. Its own picture if it has one; otherwise a freshly
// mowed patch of pitch carrying a letter of its name.
export function Crest({ src, title = '', size = 56, className }) {
  const [broken, setBroken] = useState(false);
  const radius = Math.round(size * 0.3);
  const style = { width: size, height: size, borderRadius: radius };

  if (src && !broken) {
    return (
      <span style={style} className={cn('block shrink-0 overflow-hidden border-2 border-edge bg-night-3', className)}>
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="size-full object-cover" />
      </span>
    );
  }

  const letter = badgeLetter(title);
  return (
    <span
      style={{ ...style, '--band': `${Math.max(5, Math.round(size / 6))}px`, fontSize: Math.round(size * 0.46) }}
      className={cn('mowed grid shrink-0 place-items-center border-2 border-edge font-display font-extrabold leading-none text-edge', className)}
      aria-hidden
    >
      {letter}
    </span>
  );
}
