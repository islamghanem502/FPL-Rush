import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';

// A coach's tactics board: "we set the rules, you set the formation".
// A mowed pitch, the players as knobs, the runs drawn in chalk. Attacking
// leftwards — forward is left in RTL. Knobs pop in, then the runs are drawn.
const STRIPES = Array.from({ length: 9 }, (_, i) => i * 40);
const PLAYERS = [
  [326, 120],
  [272, 48], [272, 96], [272, 144], [272, 192],
  [205, 70], [205, 120], [205, 170],
  [132, 60], [132, 120], [132, 180],
];
const RIVALS = [[84, 88], [76, 152], [104, 36]];
const RUNS = [
  { d: 'M198 62C178 36 150 30 122 38', head: 'M131.4 41.3L122 38L128.3 30.3' },
  { d: 'M196 114L144 68', head: 'M146.3 77.7L144 68L153.9 69.1', pass: true },
  { d: 'M122 124C100 140 84 128 64 118', head: 'M68.8 126.8L64 118L73.9 116.5' },
];

export function TacticsBoard({ className }) {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ delay: 0.35 })
          .from('.js-knob', { scale: 0, transformOrigin: '50% 50%', duration: 0.45, stagger: 0.045, ease: 'back.out(2.4)' })
          .from('.js-rival', { scale: 0, transformOrigin: '50% 50%', rotate: -90, duration: 0.35, stagger: 0.08, ease: 'back.out(2)' }, '-=0.2')
          .from('.js-run', { drawSVG: 0, duration: 0.7, stagger: 0.25, ease: 'power2.inOut' })
          .from('.js-head', { autoAlpha: 0, duration: 0.2, stagger: 0.25 }, '<0.55');
      });
    },
    { scope: root },
  );

  return (
    <svg ref={root} viewBox="0 0 360 240" className={cn('block', className)} aria-hidden>
      <defs>
        <clipPath id="tb-pitch">
          <rect x="4" y="4" width="352" height="232" rx="22" />
        </clipPath>
      </defs>
      <g clipPath="url(#tb-pitch)">
        {STRIPES.map((x, i) => (
          <rect key={x} x={x} y="0" width="40" height="240" fill={i % 2 ? 'var(--color-pitch-deep)' : 'var(--color-pitch)'} />
        ))}
        <g fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2.5">
          <rect x="18" y="18" width="324" height="204" rx="3" />
          <path d="M180 18V222" />
          <circle cx="180" cy="120" r="34" />
          <rect x="18" y="72" width="46" height="96" />
          <rect x="296" y="72" width="46" height="96" />
        </g>
        <rect x="12" y="100" width="8" height="40" rx="2" fill="#fff" stroke="#000" strokeWidth="2.5" />
      </g>
      <rect x="4" y="4" width="352" height="232" rx="22" fill="none" stroke="#000" strokeWidth="4" />

      <g fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {RUNS.map((run) => (
          <g key={run.d} opacity={run.pass ? 0.7 : 1}>
            <path className="js-run" d={run.d} />
            <path className="js-head" d={run.head} />
          </g>
        ))}
      </g>

      <g stroke="#000" strokeWidth="3.5" strokeLinecap="round">
        {RIVALS.map(([x, y]) => (
          <path key={`${x}-${y}`} className="js-rival" d={`M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x + 7} ${y - 7}L${x - 7} ${y + 7}`} />
        ))}
      </g>

      {PLAYERS.map(([x, y]) => (
        <circle key={`${x}-${y}`} className="js-knob" cx={x} cy={y} r="10" fill="#fff" stroke="#000" strokeWidth="3" />
      ))}
      <circle className="js-knob" cx="193" cy="106" r="5" fill="#fff" stroke="#000" strokeWidth="2" />
    </svg>
  );
}
