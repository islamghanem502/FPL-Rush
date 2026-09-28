import { gsap, prefersReducedMotion } from './gsap';

// A one-off burst for real wins (a challenge created, a champion crowned).
// Pieces are the brand's own shapes: pitch squares, volt strips, white knobs
// with the black edge. Thrown up from `host` (position: relative), they fall
// and fade, then the layer removes itself. Nothing for reduced motion.
const PIECES = [
  { w: 10, h: 10, bg: 'var(--color-pitch)', radius: 2 },
  { w: 5, h: 16, bg: 'var(--color-volt)', radius: 3 },
  { w: 12, h: 12, bg: '#fff', radius: 999, edge: true },
  { w: 9, h: 9, bg: 'var(--color-pitch-deep)', radius: 2 },
];

export function confetti(host, { count = 46, origin = 0.35 } = {}) {
  if (!host || prefersReducedMotion()) return;
  const { width, height } = host.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'visible', zIndex: '30' });
  host.appendChild(layer);

  const rand = gsap.utils.random;
  for (let i = 0; i < count; i += 1) {
    const kind = PIECES[i % PIECES.length];
    const piece = document.createElement('span');
    Object.assign(piece.style, {
      position: 'absolute',
      left: '50%',
      top: `${origin * 100}%`,
      width: `${kind.w}px`,
      height: `${kind.h}px`,
      background: kind.bg,
      borderRadius: `${kind.radius}px`,
      border: kind.edge ? '2px solid #000' : 'none',
    });
    layer.appendChild(piece);

    const spread = Math.max(160, width * 0.55);
    gsap.timeline()
      .fromTo(
        piece,
        { x: 0, y: 0, rotate: 0, scale: 0.4 },
        { x: rand(-spread, spread), y: rand(-height * 0.55, -height * 0.15) - 40, rotate: rand(-220, 220), scale: 1, duration: rand(0.45, 0.7), ease: 'power3.out' },
      )
      .to(piece, { y: `+=${height * rand(0.7, 1.1)}`, x: `+=${rand(-40, 40)}`, rotate: `+=${rand(-360, 360)}`, duration: rand(1.4, 2.2), ease: 'power1.in' })
      .to(piece, { autoAlpha: 0, duration: 0.4 }, '-=0.45');
  }
  gsap.delayedCall(3.4, () => layer.remove());
}
