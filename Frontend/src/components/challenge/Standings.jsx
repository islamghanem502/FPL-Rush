import { useState } from 'react';
import { cn } from '@/lib/cn';
import { fmt } from '@/lib/format';
import { Avatar } from '@/components/kit/Avatar';
import { Button } from '@/components/kit/Button';
import { Empty } from '@/components/kit/Feedback';
import { Medal } from '@/components/kit/Medal';
import { EmptyNet } from '@/components/art/EmptyNet';

const PREVIEW = 10;

// Standings come sorted from the server. Rank = index + 1 unless finalized.
export const rankOf = (entry, index) => entry.finalRank || index + 1;

// What keeps you going: the gap to the leader, or your percentile.
const reasonFor = (entry, rank, standings, pending) => {
  const total = standings.length;
  if (entry.challengePoints === null || entry.challengePoints === undefined) return pending;
  if (rank === 1) return total > 1 ? 'أنت في الصدارة' : 'في انتظار باقي المشاركين';
  const leader = standings[0]?.challengePoints ?? 0;
  const gap = leader - entry.challengePoints;
  if (gap === 0) return 'متعادل مع المتصدر';
  if (rank <= 3) return `الفارق مع المتصدر: ${fmt(gap)} نقطة`;
  const pct = Math.round(((total - rank) / total) * 100);
  return pct > 0 ? `أفضل من ${pct}% من المشاركين` : `الفارق مع المتصدر: ${fmt(gap)} نقطة`;
};

const Points = ({ value, className }) => (
  <span dir="ltr" className={cn('font-display font-extrabold tabular-nums', className)}>{value ?? '—'}</span>
);

// Everyone else: flat rows on the panel, photo (or initials) next to the team.
const Row = ({ entry, rank }) => (
  <li className="grid grid-cols-[32px_auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 md:px-4">
    <Medal rank={rank} />
    <Avatar user={entry} size={38} />
    <div className="min-w-0">
      <div className="truncate font-display text-[15px] font-semibold">{entry.teamName || 'فريق FPL'}</div>
      <div className="truncate text-[12.5px] text-white/50">
        {entry.managerName}
        {entry.country && <span className="text-white/35"> · {entry.country}</span>}
      </div>
    </div>
    <Points value={entry.challengePoints} className="text-[19px]" />
  </li>
);

// You: the pitch row (as in the landing's scene), with a reason to keep going.
const MeRow = ({ entry, rank, reason, className }) => (
  <li className={cn('grid grid-cols-[32px_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] bg-pitch px-3 py-3 text-edge md:px-4', className)}>
    <span className="grid place-items-center font-display text-[19px] font-extrabold tabular-nums">{rank ?? '—'}</span>
    <Avatar user={entry} size={40} light />
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="truncate font-display text-[15.5px] font-bold">{entry.teamName}</span>
        <span className="shrink-0 font-display text-[12.5px] font-bold text-edge/60">أنت</span>
      </div>
      {reason && <div className="truncate text-[12.5px] text-edge/75">{reason}</div>}
    </div>
    <Points value={entry.challengePoints} className="text-[22px]" />
  </li>
);

// `from` lets the champions screen start the list at rank 4.
export function Standings({ standings = [], meId, from = 1, emptyHint, pending = 'النقاط تُحسب مع أول جولة' }) {
  const [expanded, setExpanded] = useState(false);

  const ranked = standings.map((entry, index) => ({ entry, rank: rankOf(entry, index) }));
  const rows = ranked.filter((row) => row.rank >= from);
  const mine = ranked.find((row) => row.entry.userId === String(meId));

  if (!standings.length) {
    return <Empty art={<EmptyNet />} title="لسه مفيش مشاركين" hint={emptyHint || 'أول واحد ينضم يظهر هنا'} />;
  }

  const visible = expanded ? rows : rows.slice(0, PREVIEW);
  const hidden = rows.length - visible.length;
  const mineVisible = mine && visible.some((row) => row.entry.userId === mine.entry.userId);
  const meRow = (row, className) => (
    <MeRow key={row.entry.userId} entry={row.entry} rank={row.rank} reason={reasonFor(row.entry, row.rank, standings, pending)} className={className} />
  );

  return (
    <div className="flex flex-col gap-3">
      {visible.length > 0 && (
        <ol className="rounded-box bg-night-2 p-1.5 ring-1 ring-white/[.06] [&>li+li:not(.bg-pitch)]:border-t [&>li+li]:border-white/[.06]">
          {visible.map((row) =>
            mine && row.entry.userId === mine.entry.userId ? meRow(row, 'my-1') : <Row key={row.entry.userId} entry={row.entry} rank={row.rank} />,
          )}
        </ol>
      )}

      {/* Out of view? You still see yourself, pinned under the table */}
      {mine && !mineVisible && <ol>{meRow(mine)}</ol>}

      {hidden > 0 && (
        <Button variant="secondary" full onClick={() => setExpanded(true)}>
          عرض كل المشاركين ({fmt(standings.length)})
        </Button>
      )}
    </div>
  );
}
