import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { dayLabel, time } from '@/lib/format';
import { useBootstrap, useCurrentGw, useLiveBonus } from '@/hooks/useBonus';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Chip, LiveChip } from '@/components/ui/Chip';
import { Empty, Skeleton } from '@/components/ui/Misc';

const GWS = Array.from({ length: 38 }, (_, i) => i + 1);

function GwPicker({ value, current, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [value]);

  return (
    <div ref={ref} className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5">
      {GWS.map((gw) => (
        <button
          key={gw}
          type="button"
          data-active={gw === value}
          onClick={() => onChange(gw)}
          className={cn(
            'num shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-all',
            gw === value
              ? 'bg-brand text-ink font-black shadow-xs'
              : gw === current
              ? 'border-[1.5px] border-live text-canvas font-bold'
              : 'border-[1.5px] border-canvas/40 text-canvas/80 hover:text-canvas',
          )}
        >
          GW {gw}
        </button>
      ))}
    </div>
  );
}

// Premier League official team crest with fallback
function TeamCrest({ team, size = 26, className }) {
  const [hasError, setHasError] = useState(false);
  if (!team) return null;

  if (team.code && !hasError) {
    return (
      <img
        src={`https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`}
        alt={team.name || ''}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setHasError(true)}
        className={cn('shrink-0 object-contain select-none', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        'num inline-flex shrink-0 items-center justify-center rounded-md bg-[#ebe4d4] text-[10px] font-black text-ink select-none',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {team.short_name || 'PL'}
    </span>
  );
}

// Tactile 3D Stadium Card (Zero borders, zero clutter, authentic 3D extrusion)
function Fixture({ fixture, teams, players }) {
  const home = teams[fixture.team_h];
  const away = teams[fixture.team_a];
  const isLive = fixture.status === 'live';
  const played = fixture.status !== 'scheduled';
  const hasBonus = played && fixture.bonus && fixture.bonus.length > 0;

  return (
    <div
      className={cn(
        'relative rounded-[22px] bg-white p-4 select-none border-0 transition-all duration-150',
        isLive
          ? 'shadow-[0_6px_0_0_#00b5ad,0_12px_24px_-4px_rgba(0,181,173,0.18)]'
          : 'shadow-[0_6px_0_0_#ded5c4,0_14px_24px_-4px_rgba(26,26,26,0.06)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_0_#ded5c4]',
      )}
    >
      {/* Live match indicator tag */}
      {isLive && (
        <div className="mb-2 flex items-center justify-between text-[11px] font-black">
          <span className="inline-flex items-center gap-1.5 text-live">
            <span className="h-2 w-2 rounded-full bg-live animate-ping" />
            <span>مباشر الآن {fixture.minutes ? `· ${fixture.minutes}'` : ''}</span>
          </span>
          <span className="num text-[10px] font-bold text-live/80">بونص متوقع</span>
        </div>
      )}

      {/* Match Scoreboard Header (3-column grid: perfectly centered on all screen sizes) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Home Team */}
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <TeamCrest team={home} size={28} />
          <span className="truncate text-[13px] sm:text-[14px] font-black text-ink">
            {home?.name || `#${fixture.team_h}`}
          </span>
        </div>

        {/* 3D Score Pill — mathematically pinned dead-center */}
        <div className="justify-self-center shrink-0">
          <div
            className={cn(
              'num flex items-center justify-center gap-1.5 rounded-[12px] px-3 py-1.5 font-black select-none transition-all',
              isLive
                ? 'bg-ink text-brand shadow-[0_3px_0_0_#008f88]'
                : 'bg-ink text-canvas shadow-[0_3px_0_0_#000000]',
            )}
          >
            <span className="text-[15px] sm:text-[16px] tracking-wider whitespace-nowrap">
              {played ? `${fixture.team_h_score ?? 0} – ${fixture.team_a_score ?? 0}` : time(fixture.kickoff_time)}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex min-w-0 items-center justify-end gap-2 text-left overflow-hidden">
          <span className="truncate text-[13px] sm:text-[14px] font-black text-ink">
            {away?.name || `#${fixture.team_a}`}
          </span>
          <TeamCrest team={away} size={28} />
        </div>
      </div>

      {/* Bonus Players (Pure, clean, zero borders, 3D tactile badges) */}
      {hasBonus && (
        <div className="mt-3 space-y-2 pt-1">
          {fixture.bonus.map((b) => {
            const player = players[b.element];
            const playerTeam = player ? teams[player.team] : null;

            return (
              <div
                key={b.element}
                className="flex items-center justify-between gap-2.5 py-0.5"
              >
                {/* Player Name + Team Abbreviation */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-black text-ink">
                    {player?.web_name || `#${b.element}`}
                  </span>
                  {playerTeam?.short_name && (
                    <span className="num shrink-0 text-[10.5px] font-bold text-muted/70">
                      ({playerTeam.short_name})
                    </span>
                  )}
                </div>

                {/* Tactile 3D Bonus Badge */}
                <span
                  className={cn(
                    'num flex h-7 w-10 shrink-0 items-center justify-center rounded-[9px] text-[13px] font-black leading-none select-none transition-transform',
                    b.bonus === 3
                      ? 'bg-brand text-ink shadow-[0_3px_0_0_#c9aa09]'
                      : b.bonus === 2
                      ? 'bg-[#e2e8f0] text-ink shadow-[0_3px_0_0_#cbd5e1]'
                      : 'bg-[#fed7aa] text-[#7c2d12] shadow-[0_3px_0_0_#fba85b]',
                  )}
                >
                  +{b.bonus}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Bonus() {
  const { data: currentGw } = useCurrentGw();
  const { data: bootstrap } = useBootstrap();
  const [selected, setSelected] = useState(null);
  const gw = selected || currentGw;
  const { data, isPending, isError, dataUpdatedAt } = useLiveBonus(gw);

  const teams = bootstrap?.teams || {};
  const players = bootstrap?.players || {};

  // Group fixtures by day
  const groups = useMemo(() => {
    const byDay = new Map();
    const fixtures = data?.fixtures || [];

    fixtures.forEach((f) => {
      const key = dayLabel(f.kickoff_time);
      byDay.set(key, [...(byDay.get(key) || []), f]);
    });

    return [...byDay.entries()];
  }, [data]);

  const anyLive = data?.fixtures?.some((f) => f.status === 'live');

  return (
    <>
      <Chrome>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-black">بونص اللاعبين</h1>
            <div className="text-[12px] font-semibold opacity-70">
              {anyLive
                ? 'مباريات جارية الآن — يتحدّث كل دقيقة تلقائياً'
                : dataUpdatedAt
                ? `آخر تحديث ${time(new Date(dataUpdatedAt).toISOString())}`
                : 'الرسمي بعد المباراة · المتوقع أثناءها'}
            </div>
          </div>
          {anyLive ? <LiveChip>LIVE</LiveChip> : gw ? <Chip variant="brand">GW {gw}</Chip> : null}
        </div>
        {currentGw && <GwPicker value={gw} current={currentGw} onChange={setSelected} />}
      </Chrome>

      <Page wide>
        {data?.stale && (
          <p className="mb-3 text-center text-[12px] font-bold text-muted">
            FPL بطيء الآن — البيانات المعروضة من آخر تحديث ناجح.
          </p>
        )}

        {isPending && !data && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[90px] rounded-[16px]" />
            ))}
          </div>
        )}

        {isError && !data && (
          <Empty number="!" title="تعذر جلب بيانات الجولة" hint="FPL لا يستجيب الآن — جرّب بعد قليل" />
        )}

        {data && !data.fixtures?.length && (
          <Empty number="0" title="مفيش مباريات في الجولة دي" />
        )}

        {groups.map(([day, fixtures]) => (
          <section key={day} className="mb-4">
            <h2 className="mb-2 text-[13px] font-black text-muted">{day}</h2>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {fixtures.map((f) => (
                <Fixture key={f.id} fixture={f} teams={teams} players={players} />
              ))}
            </div>
          </section>
        ))}
      </Page>
    </>
  );
}
