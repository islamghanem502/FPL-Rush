// An empty goal with the ball rolling up to it — "nothing here yet".
// Drawn in the kit's language: white posts with the black edge, a flat net,
// the ball as a white knob. The ball rolls in once (reduced motion: resting).
const NET_X = [62, 76, 90, 104, 118, 132, 146, 160, 174];
const NET_Y = [52, 66, 80, 94, 108, 122];

export function EmptyNet({ className }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <path d="M8 139H232" stroke="rgba(255,255,255,.12)" strokeWidth="2" strokeLinecap="round" />
      <g stroke="rgba(255,255,255,.14)" strokeWidth="1.5">
        {NET_X.map((x) => <path key={`x${x}`} d={`M${x} 42V139`} />)}
        {NET_Y.map((y) => <path key={`y${y}`} d={`M52 ${y}H188`} />)}
      </g>
      {/* The frame: a black stroke under a thinner white one = white posts with an edge */}
      <path d="M45 139V35H195V139" fill="none" stroke="#000" strokeWidth="14" strokeLinejoin="round" />
      <path d="M45 139V35H195V139" fill="none" stroke="#fff" strokeWidth="8" strokeLinejoin="round" />
      <ellipse cx="206" cy="139" rx="11" ry="2.5" fill="rgba(0,0,0,.4)" />
      <g className="svg-self motion-safe:animate-roll">
        <circle cx="206" cy="124" r="13" fill="#fff" stroke="#000" strokeWidth="3" />
        <path d="M206 119.5l4.3 3.1-1.7 5h-5.2l-1.7-5z" fill="#000" />
        <path d="M206 119.5V112M210.3 122.6l7-2.3M208.6 127.6l4.3 6M203.4 127.6l-4.3 6M201.7 122.6l-7-2.3" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
