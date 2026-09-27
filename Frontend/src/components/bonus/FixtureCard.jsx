import { useState } from 'react';
import { cn } from '@/lib/cn';
import { time } from '@/lib/format';

// Official PL crest; the club's short name if the image fails.
function Crest({ team, size = 28 }) {
  const [broken, setBroken] = useState(false);
  if (!team) return null;
  if (team.code && !broken) {
    return (
      <img
        src={`https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-night-3 font-display text-[9px] font-bold" style={{ width: size, height: size }}>
      {team.short_name}
    </span>
  );
}

const TeamName = ({ team, fallback }) => (
  <>
    <span className="truncate sm:hidden">{team?.short_name || fallback}</span>
    <span className="hidden truncate sm:inline">{team?.name || fallback}</span>
  </>
);

// +3 is the pitch itself; +2 and +1 are the same green, thinner.
// +3 is the pitch itself; +2 and +1 are the same green, thinner.
const TIER = {
  3: 'bg-pitch text-edge',
  2: 'bg-pitch/55 text-white',
  1: 'bg-pitch/25 text-white',
};

// A match as data: flat (nothing here is pressable). Live matches carry the
// volt clock along the top. Bonus is the only number that matters here:
// the player (with his club) on the right, +3 / +2 / +1 closing the row.
export function FixtureCard({ fixture, teams, players }) {
  const home = teams[fixture.team_h];
  const away = teams[fixture.team_a];
  const live = fixture.status === 'live';
  const played = fixture.status !== 'scheduled';
  const bonus = played ? fixture.bonus || [] : [];

  return (
    <article className={cn('js-fixture relative overflow-hidden rounded-box bg-night-2 px-4 pb-4 pt-3.5 ring-1 md:p-5', live ? 'ring-volt/40' : 'ring-white/[.06]')}>
      {live && (
        <span className="absolute inset-x-0 top-0 block h-1 bg-white/10" aria-hidden>
          <span className="block h-full origin-right bg-volt" style={{ transform: `scaleX(${Math.min(1, (fixture.minutes || 0) / 90)})` }} />
        </span>
      )}

      <div className="flex items-center justify-between text-[12px] md:text-[12.5px]">
        {live ? (
          <span className="flex items-center gap-2 font-display font-semibold text-volt">
            <span className="size-2 animate-pulse rounded-full bg-volt" aria-hidden />
            مباشر {fixture.minutes ? <span dir="ltr">{fixture.minutes}'</span> : null}
          </span>
        ) : (
          <span className="text-white/45">{played ? 'انتهت' : time(fixture.kickoff_time)}</span>
        )}
        {live && <span className="text-white/45">بونص متوقع</span>}
      </div>

      {/* Home on the right (RTL), and so is the home score */}
      <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 font-display text-[14px] font-semibold md:gap-2.5 md:text-[15px]">
          <Crest team={home} size={26} />
          <TeamName team={home} fallback={`#${fixture.team_h}`} />
        </div>
        <div className="flex items-baseline gap-2 font-display text-[22px] font-extrabold leading-none tabular-nums md:text-[26px]">
          {played ? (
            <>
              <span>{fixture.team_h_score ?? 0}</span>
              <span className="text-[16px] text-white/30">–</span>
              <span>{fixture.team_a_score ?? 0}</span>
            </>
          ) : (
            <span className="text-[14px] font-semibold text-white/40">ضد</span>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 font-display text-[14px] font-semibold md:gap-2.5 md:text-[15px]">
          <TeamName team={away} fallback={`#${fixture.team_a}`} />
          <Crest team={away} size={26} />
        </div>
      </div>

      {bonus.length > 0 ? (
        <ul className="mt-3.5 flex flex-col gap-2 border-t border-white/[.06] pt-3.5">
          {bonus.map((b) => {
            const player = players[b.element];
            const club = player ? teams[player.team] : null;
            return (
              <li key={b.element} className="flex items-center gap-2.5">
                {club && <Crest team={club} size={20} />}
                <span className="min-w-0 truncate text-[15px] font-semibold">{player?.web_name || `#${b.element}`}</span>
                {club && <span className="shrink-0 text-[12px] text-white/40">{club.short_name}</span>}
                {/* The bonus closes the row. dir=ltr only on the number: on the pill it
                    would flip ms-auto to the wrong side. */}
                <span className={cn('ms-auto grid h-8 w-11 shrink-0 place-items-center rounded-[10px] font-display text-[14px] font-extrabold', TIER[b.bonus] || TIER[1])}>
                  <span dir="ltr">+{b.bonus}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3.5 border-t border-white/[.06] pt-3.5 text-[13px] text-white/40">
          {played ? 'البونص لسه ما اتحسبش للماتش ده.' : 'البونص بيبان أول ما الماتش يبدأ.'}
        </p>
      )}
    </article>
  );
}
