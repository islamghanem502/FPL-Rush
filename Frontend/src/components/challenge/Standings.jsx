import { useState } from 'react';
import { cn } from '@/lib/cn';
import { fmt } from '@/lib/format';
import { RankCircle } from '@/components/ui/Numbers';
import { NameStrip } from '@/components/ui/NameStrip';
import { Button } from '@/components/ui/Button';
import { Avatar, Empty } from '@/components/ui/Misc';

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

// Every participant row shows their photo (or initials) next to the team.
const Row = ({ entry, rank, last }) => (
  <div className={cn('grid grid-cols-[30px_auto_1fr_auto] items-center gap-3 py-3', !last && 'border-b border-line')}>
    <RankCircle rank={rank} />
    <Avatar user={entry} size={36} />
    <div className="min-w-0">
      <div className="truncate text-[15px] font-bold">{entry.teamName || 'فريق FPL'}</div>
      <div className="truncate text-[12.5px] font-semibold text-muted">
        {entry.managerName}
        {entry.country && <span className="opacity-70"> · {entry.country}</span>}
      </div>
    </div>
    <div className="num text-[21px]">{entry.challengePoints ?? '—'}</div>
  </div>
);

// `from` lets the champions screen start the list at rank 4.
export function Standings({ standings = [], meId, from = 1, emptyHint, pending = 'النقاط تُحسب مع أول جولة' }) {
  const [expanded, setExpanded] = useState(false);

  const ranked = standings.map((entry, index) => ({ entry, rank: rankOf(entry, index) }));
  const rows = ranked.filter((row) => row.rank >= from);
  const mine = ranked.find((row) => row.entry.userId === String(meId));

  if (!standings.length) {
    return <Empty number="00" title="لسه مفيش مشاركين" hint={emptyHint || 'أول واحد ينضم يظهر هنا'} />;
  }

  const visible = expanded ? rows : rows.slice(0, PREVIEW);
  const hidden = rows.length - visible.length;
  const stripInside = mine && visible.some((row) => row.entry.userId === mine.entry.userId);
  const strip = (row, className) => (
    <NameStrip
      key={row.entry.userId}
      rank={row.rank}
      user={row.entry}
      name={row.entry.teamName}
      reason={reasonFor(row.entry, row.rank, standings, pending)}
      value={row.entry.challengePoints ?? '—'}
      className={className}
    />
  );

  return (
    <div>
      {visible.length > 0 && (
        <div className="rounded-card bg-paper px-4 py-1.5">
          {visible.map((row, index) =>
            mine && row.entry.userId === mine.entry.userId
              ? strip(row, 'my-2')
              : <Row key={row.entry.userId} entry={row.entry} rank={row.rank} last={index === visible.length - 1} />,
          )}
        </div>
      )}

      {mine && !stripInside && strip(mine, 'mt-2.5')}

      {hidden > 0 && (
        <Button variant="tertiary" full className="mt-2" onClick={() => setExpanded(true)}>
          عرض كل المشاركين ({fmt(standings.length)})
        </Button>
      )}
    </div>
  );
}
