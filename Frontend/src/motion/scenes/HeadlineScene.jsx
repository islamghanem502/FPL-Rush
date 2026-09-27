import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { HEADLINE } from './specs';

// "جمعت كام نقطة؟" — the hero line as a Remotion text effect.
// Line one rises word by word out of a mask (never per letter: Arabic letters
// join). Line two is a switch turning on: a pitch pill grows from the right,
// the knob rides its moving edge, and the word is revealed behind it.
// Composition: see HEADLINE in ./specs

const PILL = 190; // pill height, in composition pixels
const EDGE = 6; // black edge — about 2px once the player scales to a phone
const KNOB = PILL - 40;
const PAD_KNOB = PILL + 24; // room for the knob at the finished (left) end
const PAD_END = 64;

const useSpring = (delay, config) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

function Rise({ delay, children }) {
  const p = useSpring(delay, { damping: 15, stiffness: 120, mass: 0.9 });
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', padding: '0 8px 24px', marginBottom: -24 }}>
      <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 115}%) rotate(${(1 - p) * 7}deg)` }}>{children}</span>
    </span>
  );
}

function Switch() {
  const pop = useSpring(10, { damping: 11, stiffness: 170 });
  const on = useSpring(18, { damping: 17, stiffness: 80 });
  const wobble = useSpring(40, { damping: 5, stiffness: 150 });

  // Distance of the moving (left) end from the container's left side.
  const edge = `calc((100% - ${PILL}px) * ${1 - on})`;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: PILL, paddingRight: PAD_END, paddingLeft: PAD_KNOB }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          left: edge,
          background: 'var(--color-pitch)',
          border: `${EDGE}px solid var(--color-edge)`,
          borderRadius: 999,
          boxShadow: `0 ${EDGE * 2}px 0 var(--color-edge)`,
          transform: `scale(${pop})`,
          transformOrigin: `calc(100% - ${PILL / 2}px) 50%`,
        }}
      />
      <div
        style={{
          position: 'relative',
          fontSize: 132,
          fontWeight: 900,
          lineHeight: 1,
          paddingBottom: 18,
          color: 'var(--color-edge)',
          // Revealed from the right, just behind the knob
          clipPath: `inset(-60px 0 -60px calc((100% + ${PAD_KNOB + PAD_END - PILL}px) * ${1 - on} - 24px))`,
        }}
      >
        نقطة
        <span style={{ display: 'inline-block', transform: `rotate(${(1 - wobble) * -40}deg)`, transformOrigin: '50% 85%' }}>؟</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `calc(${edge} + ${(PILL - KNOB) / 2}px)`,
          width: KNOB,
          height: KNOB,
          marginTop: -KNOB / 2,
          borderRadius: 999,
          background: '#fff',
          border: `${EDGE}px solid var(--color-edge)`,
          boxShadow: `0 ${EDGE}px 0 var(--color-edge)`,
          transform: `scale(${pop})`,
        }}
      />
    </div>
  );
}

export function HeadlineScene() {
  return (
    <AbsoluteFill
      style={{
        direction: 'rtl',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 26,
        fontFamily: 'var(--font-display)',
        paddingBottom: 14,
      }}
    >
      <div style={{ fontSize: 156, fontWeight: 900, lineHeight: 1.15, color: '#fff' }}>
        <Rise delay={0}>جمعت</Rise> <Rise delay={5}>كام</Rise>
      </div>
      <Switch />
    </AbsoluteFill>
  );
}
