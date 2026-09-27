import { useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import { ChallengeScene } from '@/motion/scenes/ChallengeScene';
import { CHALLENGE } from '@/motion/scenes/specs';
import { prefersReducedMotion } from '@/motion/gsap';

// A frame late in the run: the finished table, for reduced-motion users.
const RESULT_FRAME = CHALLENGE.durationInFrames - 40;

// Loops only while on screen. Props change the scene live (no restart).
export default function ChallengePreview({ mode, startGw, length, prizes }) {
  const player = useRef(null);
  const box = useRef(null);
  const still = prefersReducedMotion();
  const inputProps = useMemo(() => ({ mode, startGw, length, prizes }), [mode, startGw, length, prizes]);

  useEffect(() => {
    if (still || !box.current) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) player.current?.play();
      else player.current?.pause();
    }, { threshold: 0.25 });
    io.observe(box.current);
    return () => io.disconnect();
  }, [still]);

  return (
    <div ref={box} className="h-full w-full">
      <Player
        ref={player}
        component={ChallengeScene}
        inputProps={inputProps}
        {...CHALLENGE}
        initialFrame={still ? RESULT_FRAME : 0}
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        initiallyMuted // silent scene — see HeroHeadline
        numberOfSharedAudioTags={0}
        style={{ width: '100%', height: '100%', direction: 'ltr' }} // player canvas is LTR; the scene is RTL
      />
    </div>
  );
}
