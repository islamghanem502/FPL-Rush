import { useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { HeadlineScene } from '@/motion/scenes/HeadlineScene';
import { HEADLINE } from '@/motion/scenes/specs';
import { displayFontReady } from '@/motion/fonts';
import { prefersReducedMotion } from '@/motion/gsap';

const LAST = HEADLINE.durationInFrames - 1;

// Loaded lazily (Remotion stays out of the main bundle). Plays once and holds
// the last frame. The real <h1> lives in the page; this is its animated face.
export default function HeroHeadline() {
  const [ready, setReady] = useState(false);
  const still = prefersReducedMotion();

  useEffect(() => {
    let alive = true;
    displayFontReady().then(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  if (!ready) return null;
  return (
    <Player
      component={HeadlineScene}
      {...HEADLINE}
      autoPlay={!still}
      initialFrame={still ? LAST : 0}
      loop={false}
      moveToBeginningWhenEnded={false}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      // Silent scenes: muted, or the player waits for an AudioContext that
      // browsers only start after a click — and autoplay never begins.
      initiallyMuted
      numberOfSharedAudioTags={0}
      overflowVisible
      // The player lays out its scaled canvas assuming LTR; scenes set RTL inside.
      style={{ width: '100%', height: '100%', direction: 'ltr' }}
    />
  );
}
