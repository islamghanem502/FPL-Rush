import { useMemo } from 'react';
import { AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { gameweeks, gwRange } from '@/lib/format';
import { CHALLENGE } from './specs';

// A challenge playing out, driven live by the landing's controls:
//   mode      — 'public' (open to every user) or 'private' (invite code)
//   startGw   — the current gameweek (private challenges start there)
//   length    — how many gameweeks the challenge runs (the slider)
//   prizes    — prizes for the top three (the toggle)
// The knob walks the gameweeks along a slider-like track; after each one the
// table reshuffles and you climb from last to first. Rivals are faceless bars
// on purpose — this is an illustration, not somebody's real team.
// Nothing here is pressable, so nothing wears the tactile edge + hard shadow:
// rows are flat, ranks are plain numbers.

const INTRO = 24; // rows arrive
const HOLD = 70; // final table stays up
const REWIND = 16; // rows fade, the knob glides back to kickoff — then loop
const RUN = CHALLENGE.durationInFrames - INTRO - HOLD - REWIND; // shared by all gameweeks

const EDGE = 5;
// Sizes are in composition px; on a phone the player shows this at ~0.37×,
// so nothing that must be read goes below ~30px here.
const TRACK = { y: 214, left: 44, right: 856, h: 26 };
const ROW = { y: 318, h: 90, gap: 12, knob: 64 };
const RIVALS = [
  { id: 'a', bar: 210, seed: 7 },
  { id: 'b', bar: 150, seed: 19 },
  { id: 'c', bar: 240, seed: 31 },
];

const sum = (list) => list.reduce((a, b) => a + b, 0);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const overshoot = Easing.bezier(0.34, 1.56, 0.64, 1);
const glide = Easing.inOut(Easing.cubic);

// Stable 0..1 noise for (player, gameweek) — same numbers on every render.
const noise = (a, b) => {
  let h = Math.imul(a * 374761393 + b * 668265263, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

// Deterministic scores. You open with a quiet week, then steadily outscore
// everyone; the last week is only topped up if that still isn't enough.
export function simulate(length) {
  const rivals = RIVALS.map((r) => ({ id: r.id, pts: Array.from({ length }, (_, i) => 38 + Math.round(noise(r.seed, i) * 44)) }));
  const you = Array.from({ length }, (_, i) => (i === 0 ? 42 : 58 + Math.round(noise(99, i) * 30)));
  const best = Math.max(...rivals.map((r) => sum(r.pts)));
  you[length - 1] = Math.max(you[length - 1], best - sum(you.slice(0, -1)) + 6);

  const players = [...rivals, { id: 'you', pts: you }];
  const table = [];
  let order = players.map((p) => p.id);
  for (let k = 0; k <= length; k += 1) {
    const totals = Object.fromEntries(players.map((p) => [p.id, sum(p.pts.slice(0, k))]));
    order = [...order].sort((x, y) => totals[y] - totals[x]); // stable: ties keep last week's order
    table.push({ order, totals });
  }
  return table;
}

const slotY = (slot) => ROW.y + slot * (ROW.h + ROW.gap);

function Trophy({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 6h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3" />
    </svg>
  );
}

const COPY = {
  public: { title: 'تحدي عام', note: 'مفتوح لكل المستخدمين' },
  private: { title: 'تحدي الشلة', note: 'خاص بكود دعوة' },
};

export function ChallengeScene({ mode = 'private', startGw = 1, length = 4, prizes = true }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const n = Math.max(1, length);
  const table = useMemo(() => simulate(n), [n]);

  // Where we are: `t` gameweeks played (float), inside gameweek k.
  const t = Math.min(n, Math.max(0, ((frame - INTRO) / RUN) * n));
  const k = Math.min(n - 1, Math.floor(t));
  const local = t - k;
  const rewind = glide(clamp01((frame - (durationInFrames - REWIND)) / (REWIND - 1)));
  const knobAt = ((k + glide(clamp01(local / 0.45))) / n) * (1 - rewind); // the knob walks first…
  const settle = overshoot(clamp01((local - 0.4) / 0.45)); // …then the table reshuffles
  const count = glide(clamp01((local - 0.4) / 0.4));
  const before = table[k];
  const after = table[k + 1];

  const finished = frame >= INTRO + RUN;
  const cheer = spring({ frame: frame - (INTRO + RUN + 6), fps, config: { damping: 9, stiffness: 160 } });

  const endGw = startGw + n - 1;
  const knobX = lerp(TRACK.right, TRACK.left, knobAt); // RTL: kickoff on the right
  const bubble = Math.min(spring({ frame: frame - 8, fps, config: { damping: 13, stiffness: 150 } }), 1 - rewind);

  return (
    <AbsoluteFill style={{ direction: 'rtl', fontFamily: 'var(--font-display)', color: '#fff' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 6, right: 0, left: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.15 }}>{COPY[mode].title}</div>
          <div style={{ fontSize: 32, fontWeight: 500, opacity: 0.6, marginTop: 4 }}>{`${gameweeks(n)} · ${COPY[mode].note}`}</div>
        </div>
        <div
          dir="ltr"
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: 'var(--color-edge)',
            background: 'var(--color-pitch)',
            borderRadius: 999,
            padding: '12px 26px',
            whiteSpace: 'nowrap',
          }}
        >
          {gwRange(startGw, endGw)}
        </div>
      </div>

      {/* Gameweek track */}
      <div
        style={{
          position: 'absolute',
          top: TRACK.y,
          left: TRACK.left - TRACK.h / 2,
          width: TRACK.right - TRACK.left + TRACK.h,
          height: TRACK.h,
          borderRadius: 999,
          border: `${EDGE}px solid var(--color-edge)`,
          background: `linear-gradient(to left, var(--color-pitch) ${(knobAt * (TRACK.right - TRACK.left) + TRACK.h / 2).toFixed(1)}px, var(--color-night-3) 0)`,
        }}
      />
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = lerp(TRACK.right, TRACK.left, i / n);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: TRACK.y + TRACK.h / 2 - 5,
              left: x - 5,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: i / n <= knobAt ? 'var(--color-edge)' : 'rgba(255,255,255,.35)',
            }}
          />
        );
      })}
      <div dir="ltr" style={{ position: 'absolute', top: TRACK.y + 34, right: CHALLENGE.compositionWidth - TRACK.right - 30, fontSize: 28, opacity: 0.55 }}>
        {`GW ${startGw}`}
      </div>
      <div dir="ltr" style={{ position: 'absolute', top: TRACK.y + 34, left: TRACK.left - 30, fontSize: 28, opacity: 0.55 }}>
        {`GW ${endGw}`}
      </div>
      {/* The knob, carrying the gameweek being played */}
      <div
        dir="ltr"
        style={{
          position: 'absolute',
          top: TRACK.y - 84,
          left: Math.min(Math.max(knobX, 70), CHALLENGE.compositionWidth - 70), // never clipped at the ends
          transform: `translateX(-50%) scale(${bubble})`,
          transformOrigin: '50% 100%',
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--color-edge)',
          background: '#fff',
          border: `${EDGE - 1}px solid var(--color-edge)`,
          borderRadius: 14,
          padding: '6px 14px',
          whiteSpace: 'nowrap',
        }}
      >
        {`GW ${startGw + k}`}
      </div>
      <div
        style={{
          position: 'absolute',
          top: TRACK.y + TRACK.h / 2 - 25,
          left: knobX - 25,
          width: 50,
          height: 50,
          borderRadius: 999,
          background: '#fff',
          border: `${EDGE}px solid var(--color-edge)`,
        }}
      />

      {/* Rank marks — fixed slots; rows slide between them */}
      {[0, 1, 2, 3].map((slot) => {
        const prize = prizes && slot < 3;
        return (
          <div
            key={slot}
            style={{
              position: 'absolute',
              top: slotY(slot) + (ROW.h - ROW.knob) / 2,
              right: 0,
              width: ROW.knob,
              height: ROW.knob,
              display: 'grid',
              placeItems: 'center',
              fontSize: 40,
              fontWeight: 800,
              color: prize ? 'var(--color-pitch)' : 'rgba(255,255,255,.5)',
            }}
          >
            {prize ? <Trophy size={46} /> : slot + 1}
          </div>
        );
      })}

      {/* Rows */}
      {['a', 'b', 'c', 'you'].map((id, i) => {
        const isYou = id === 'you';
        const rival = RIVALS.find((r) => r.id === id);
        const y = lerp(slotY(before.order.indexOf(id)), slotY(after.order.indexOf(id)), settle);
        const points = Math.round(lerp(before.totals[id], after.totals[id], count));
        const enter = spring({ frame: frame - i * 4, fps, config: { damping: 14, stiffness: 120 } });
        const lift = isYou && finished ? 1 + cheer * 0.03 : 1;
        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              top: y,
              right: ROW.knob + 18,
              left: 0,
              height: ROW.h,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '0 30px',
              borderRadius: 24,
              background: isYou ? 'var(--color-pitch)' : 'var(--color-night-3)',
              color: isYou ? 'var(--color-edge)' : '#fff',
              opacity: Math.min(enter, 1 - rewind),
              transform: `translateX(${(1 - enter) * -80}px) scale(${lift})`,
              zIndex: isYou ? 2 : 1,
            }}
          >
            {isYou ? (
              <span style={{ fontSize: 46, fontWeight: 800 }}>أنت</span>
            ) : (
              <span style={{ width: rival.bar, height: 22, borderRadius: 999, background: 'rgba(255,255,255,.16)' }} />
            )}
            {isYou && finished && (
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  background: 'var(--color-edge)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '6px 16px',
                  transform: `scale(${cheer})`,
                }}
              >
                بطل التحدي
              </span>
            )}
            <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span dir="ltr" style={{ fontSize: 50, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{points}</span>
              <span style={{ fontSize: 30, fontWeight: 500, opacity: 0.6 }}>نقطة</span>
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
