import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentGameweek, useLiveBonus, useBootstrapData } from '../hooks/useLiveBonus';
import Layout from '../components/Layout';

// ── Medal colours ──────────────────────────────────────────────────────────────
const MEDAL = {
  3: { label: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/15', border: 'border-yellow-400/40' },
  2: { label: '🥈', color: 'text-slate-300',  bg: 'bg-slate-400/15',  border: 'border-slate-400/40'  },
  1: { label: '🥉', color: 'text-amber-600',  bg: 'bg-amber-600/15',  border: 'border-amber-600/40'  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatKickoff(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(fixtures) {
  const groups = {};
  fixtures.forEach((f) => {
    const key = f.kickoff_time
      ? new Date(f.kickoff_time).toLocaleDateString('ar-EG', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : 'غير محدد';
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });
  return groups;
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, minutes }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-red-400 font-bold text-xs uppercase tracking-wider">
          {minutes ? `${minutes}'` : 'مباشر'}
        </span>
      </div>
    );
  }
  if (status === 'finished') {
    return (
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">منتهية</span>
    );
  }
  return (
    <span className="text-slate-500 text-xs font-semibold">قادمة</span>
  );
}

// ── Fixture Card ───────────────────────────────────────────────────────────────
function FixtureCard({ fixture, teams, players }) {
  const homeTeam = teams?.[fixture.team_h];
  const awayTeam = teams?.[fixture.team_a];
  const homeName  = homeTeam?.short_name ?? `Team ${fixture.team_h}`;
  const awayName  = awayTeam?.short_name ?? `Team ${fixture.team_a}`;
  const homeFullName = homeTeam?.name ?? homeName;
  const awayFullName = awayTeam?.name ?? awayName;

  const isLive     = fixture.status === 'live';
  const isFinished = fixture.status === 'finished';
  const hasScore   = isLive || isFinished;

  const bonusList = fixture.bonus ?? [];

  // Group bonus by points value for compact display
  const byBonus = {};
  bonusList.forEach((b) => {
    if (!byBonus[b.bonus]) byBonus[b.bonus] = [];
    byBonus[b.bonus].push(b);
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300
        ${isLive
          ? 'border-red-500/40 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-red-900/20 shadow-lg shadow-red-900/20'
          : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/60'
        }`}
    >
      {/* Live glow strip */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      )}

      {/* Card Header — teams + score */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Home */}
          <div className="flex-1 text-right">
            <p className="font-black text-white text-base leading-tight">{homeName}</p>
            <p className="text-slate-400 text-[11px] mt-0.5 truncate">{homeFullName}</p>
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center gap-1 min-w-[72px]">
            {hasScore ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tabular-nums">
                  {fixture.team_h_score ?? 0}
                </span>
                <span className="text-slate-500 font-bold">–</span>
                <span className="text-2xl font-black text-white tabular-nums">
                  {fixture.team_a_score ?? 0}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-bold text-base">
                {formatKickoff(fixture.kickoff_time)}
              </span>
            )}
            <StatusBadge status={fixture.status} minutes={fixture.minutes} />
          </div>

          {/* Away */}
          <div className="flex-1 text-left">
            <p className="font-black text-white text-base leading-tight">{awayName}</p>
            <p className="text-slate-400 text-[11px] mt-0.5 truncate">{awayFullName}</p>
          </div>
        </div>
      </div>

      {/* Bonus section */}
      {(isLive || isFinished) && bonusList.length > 0 && (
        <div className="border-t border-slate-700/60 px-5 py-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            {isFinished ? 'البونص الرسمي' : 'البونص المتوقع'}
          </p>

          {[3, 2, 1].map((pts) => {
            const group = byBonus[pts];
            if (!group) return null;
            const m = MEDAL[pts];
            return (
              <div key={pts} className={`flex items-start gap-2 rounded-xl px-3 py-2 border ${m.bg} ${m.border}`}>
                <span className="text-base mt-0.5">{m.label}</span>
                <div className="flex-1 min-w-0">
                  {group.map((p, i) => {
                    const playerName = players?.[p.element]?.web_name ?? `#${p.element}`;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className={`font-bold text-sm ${m.color}`}>{playerName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.bps != null && (
                            <span className="text-slate-400 text-xs">BPS: {p.bps}</span>
                          )}
                          <span className={`font-black text-sm ${m.color}`}>+{pts}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduled — no bonus to show */}
      {fixture.status === 'scheduled' && (
        <div className="border-t border-slate-700/40 px-5 py-3 text-center">
          <p className="text-slate-600 text-xs">لم تبدأ المباراة بعد</p>
        </div>
      )}
    </motion.div>
  );
}

// ── GW Selector ───────────────────────────────────────────────────────────────
function GWSelector({ current, selected, onChange }) {
  const total = 38;
  const gws = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <button
        onClick={() => onChange(Math.max(1, selected - 1))}
        disabled={selected <= 1}
        className="px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition text-sm font-bold"
      >
        ◀
      </button>

      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(Number(e.target.value))}
          className="appearance-none bg-slate-700/60 border border-slate-600/50 text-white font-bold rounded-xl px-4 py-2 pr-8 text-sm cursor-pointer focus:outline-none focus:border-green-500/60"
        >
          {gws.map((gw) => (
            <option key={gw} value={gw}>
              الجولة {gw} {gw === current ? '(الحالية)' : ''}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
      </div>

      <button
        onClick={() => onChange(Math.min(total, selected + 1))}
        disabled={selected >= total}
        className="px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition text-sm font-bold"
      >
        ▶
      </button>
    </div>
  );
}


// ── Main Page ──────────────────────────────────────────────────────────────────
const BonusPage = () => {
  const { data: currentGW, isLoading: gwLoading } = useCurrentGameweek();
  const { data: bootstrap } = useBootstrapData();
  const [selectedGW, setSelectedGW] = useState(null);

  // Once we know the current GW, default to it
  useEffect(() => {
    if (currentGW && !selectedGW) setSelectedGW(currentGW);
  }, [currentGW, selectedGW]);

  const {
    data: bonusData,
    isLoading: bonusLoading,
    isFetching,
    isError,
    error,
  } = useLiveBonus(selectedGW);

  const teams   = bootstrap?.teams   ?? {};
  const players = bootstrap?.players ?? {};
  const fixtures = bonusData?.fixtures ?? [];
  const dateGroups = groupByDate(fixtures);

  const isInitialLoading = (gwLoading || bonusLoading) && !bonusData;

  return (
    <Layout>
      <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-green-400 text-xs font-semibold uppercase tracking-widest">Live Tracker</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            متابعة <span className="text-[#22c55e]">البونص</span> المباشر
          </h1>
          <p className="text-slate-400 text-sm">
            بيانات BPS والبونص المتوقع — يتحدث كل دقيقة
          </p>
        </motion.div>

        {/* ── GW Selector ──────────────────────────────────────────────── */}
        {!gwLoading && selectedGW && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col items-center gap-3"
          >
            <GWSelector
              current={currentGW}
              selected={selectedGW}
              onChange={setSelectedGW}
            />

            {/* Status row */}
            <div className="flex items-center gap-3">
              {isFetching && !isInitialLoading && (
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  جاري التحديث...
                </span>
              )}
              {bonusData?.stale && (
                <span className="text-amber-400 text-xs">⚠ بيانات مؤقتة</span>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Loading Spinner (initial only) ───────────────────────────── */}
        <AnimatePresence>
          {isInitialLoading && (
            <motion.div
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin" />
              </div>
              <p className="text-slate-400 text-sm animate-pulse">جاري تحميل البيانات...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error State ───────────────────────────────────────────────── */}
        {isError && !bonusData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-400 font-bold mb-2">فشل تحميل البيانات</p>
            <p className="text-slate-500 text-sm">
              {error?.message ?? 'تحقق من الاتصال وحاول مجدداً'}
            </p>
          </motion.div>
        )}

        {/* ── Fixtures ─────────────────────────────────────────────────── */}
        {!isInitialLoading && bonusData && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGW}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {fixtures.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  لا توجد مباريات لهذه الجولة
                </div>
              ) : (
                Object.entries(dateGroups).map(([dateLabel, dayFixtures]) => (
                  <div key={dateLabel}>
                    {/* Date heading */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-slate-700/60" />
                      <span className="text-slate-400 text-sm font-semibold px-2">{dateLabel}</span>
                      <div className="h-px flex-1 bg-slate-700/60" />
                    </div>

                    {/* Fixture cards */}
                    <div className="grid gap-3">
                      {dayFixtures.map((fixture) => (
                        <FixtureCard
                          key={fixture.id}
                          fixture={fixture}
                          teams={teams}
                          players={players}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </Layout>
  );
};

export default BonusPage;
