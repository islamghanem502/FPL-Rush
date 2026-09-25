// Numbers are always latin digits (Archivo) — never Arabic-Indic.
export const fmt = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('en-US'));

export const fmtRank = (n) => (n ? `#${fmt(n)}` : '—');

// 4,568,476 → 4.6M — for tight spaces like chart labels
export const fmtCompact = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
};

export const gwRange = (start, end) => (start === end ? `GW ${start}` : `GW ${start}—${end}`);

export const plural = (n, one, many) => `${fmt(n)} ${Number(n) === 1 ? one : many}`;

export const time = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '';

export const dayLabel = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }) : 'غير محدد';

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'FR';
