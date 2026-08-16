import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import {
  useChallenges,
  useEnrollChallenge,
  useChallengeStandings,
  useUser,
  usePvPChallenges,
  usePvPChallengeById,
  usePvPStandings,
  useSubmitPvPPrediction,
} from "../hooks/useAuthQuery";

// --- Sub-Components ---
const TextWithLinks = ({ text, className }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(urlRegex);
        return (
          <span key={lineIdx} className="block mb-1 last:mb-0">
            {parts.map((part, i) =>
              urlRegex.test(part) ? (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] underline underline-offset-2 hover:text-white transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </a>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </span>
        );
      })}
    </div>
  );
};

const ConditionItem = ({ label, isMet }) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5">
    <div
      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0
      ${isMet
          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
    >
      {isMet ? "✓" : "✕"}
    </div>
    <span className={`text-[11px] font-bold ${isMet ? "text-gray-300" : "text-gray-500"}`}>
      {label}
    </span>
  </div>
);

const PlayerRow = ({ player, index, isCurrentUser, isSticky, isPvP }) => (
  <tr
    className={`hover:bg-slate-800/40 transition-colors group ${isCurrentUser ? (isPvP ? "bg-purple-500/10" : "bg-[#22c55e]/10") : ""
      } ${isSticky ? `border-t-2 ${isPvP ? "border-purple-500/20" : "border-[#22c55e]/20"} bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-10` : ""}`}
  >
    <td className="p-2.5 sm:p-4">
      <div
        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-md transition-transform duration-300 group-hover:scale-110 mx-auto
        ${index === 0
            ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black"
            : index === 1
              ? "bg-gradient-to-br from-slate-200 to-slate-400 text-black"
              : index === 2
                ? "bg-gradient-to-br from-orange-300 to-orange-600 text-black"
                : "bg-slate-800 text-gray-400 border border-slate-700"
          }`}
      >
        {index + 1}
      </div>
    </td>
    <td className="p-2.5 sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm">
          {player.avatar ? (
            <img src={player.avatar} alt={player.managerName} className="w-full h-full object-cover" />
          ) : (
            <span>{player.managerName ? player.managerName.charAt(0).toUpperCase() : '👤'}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className={`font-black text-xs sm:text-sm text-white truncate flex items-center gap-1.5 max-w-[120px] sm:max-w-[240px]`}>
            <span className="truncate">{player.teamName}</span>
            {isCurrentUser && (
              <span className={`text-[8px] ${isPvP ? "bg-purple-500 text-white" : "bg-[#22c55e] text-[#04120A]"} px-1.5 py-0.5 rounded-full font-black uppercase shrink-0`}>أنت</span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 font-bold mt-0.5 truncate max-w-[120px] sm:max-w-[240px]">
            {player.managerName} {player.country ? `• ${player.country}` : ''}
          </div>
        </div>
      </div>
    </td>
    <td className="p-2.5 sm:p-4 text-center">
      <div className={`font-black text-base sm:text-2xl tracking-tighter ${index < 3 ? (isPvP ? "text-purple-400" : "text-[#22c55e]") : "text-white"}`}>
        {player.points ?? player.challengePoints ?? player.totalPoints ?? 0}
      </div>
    </td>
  </tr>
);

// --- Compact Horizontal Matchup Card ---
const MatchupCard = ({ matchup, idx, selection, onSelect, disabled }) => {
  const isP1 = selection === "p1";
  const isDraw = selection === "draw";
  const isP2 = selection === "p2";

  return (
    <div className={`relative bg-slate-900/70 rounded-2xl border transition-all duration-200 overflow-hidden
      ${selection ? "border-purple-500/50 shadow-[0_0_16px_rgba(168,85,247,0.15)]" : "border-slate-700/60 hover:border-purple-500/30"}`}
    >
      {/* 2X badge */}
      {matchup.isDouble && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-orange-400 flex items-center gap-1 animate-[pulse_2s_ease-in-out_infinite]">
          <span>🔥</span> Double (6 نقاط)
        </div>
      )}

      {/* Match number */}
      <div className="absolute top-1.5 right-2 text-[9px] text-gray-600 font-bold">#{idx + 1}</div>

      {/* Horizontal layout */}
      <div className="flex items-center gap-1 p-2.5">

        {/* Player 1 */}
        <button
          onClick={() => !disabled && onSelect(idx, "p1")}
          disabled={disabled}
          className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-all duration-200 text-right
            ${isP1
              ? "bg-purple-500/25 border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              : "bg-slate-800/60 border border-transparent hover:bg-slate-700/60"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
        >
          {matchup.p1_photo ? (
            <img src={matchup.p1_photo} className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 transition-all
              ${isP1 ? "border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "border-slate-600"}`} alt={matchup.p1_name} />
          ) : (
            <div className={`w-9 h-9 rounded-full shrink-0 border-2 flex items-center justify-center text-sm bg-slate-700
              ${isP1 ? "border-purple-400" : "border-slate-600"}`}>⚽</div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-black leading-tight truncate transition-colors
              ${isP1 ? "text-purple-300" : "text-white"}`}>
              {matchup.p1_name || "اللاعب الأول"}
            </p>
            {isP1 && <p className="text-[9px] text-purple-400 font-bold">✓ اخترت</p>}
          </div>
        </button>

        {/* Center: VS + Draw */}
        <div className="flex flex-col items-center gap-1 shrink-0 px-1">
          <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">vs</span>
          <button
            onClick={() => !disabled && onSelect(idx, "draw")}
            disabled={disabled}
            className={`w-10 h-10 rounded-full font-black text-[9px] uppercase transition-all duration-200 border-2 leading-tight
              ${isDraw
                ? "bg-slate-500/40 border-slate-300 text-white shadow-[0_0_10px_rgba(148,163,184,0.4)] scale-110"
                : "bg-slate-800 border-slate-600 text-gray-400 hover:border-slate-400 hover:text-white"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
          >
            تعادل
          </button>
          {isDraw && <span className="text-[8px] text-slate-300 font-bold">✓</span>}
        </div>

        {/* Player 2 */}
        <button
          onClick={() => !disabled && onSelect(idx, "p2")}
          disabled={disabled}
          className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-all duration-200 text-left flex-row-reverse
            ${isP2
              ? "bg-purple-500/25 border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              : "bg-slate-800/60 border border-transparent hover:bg-slate-700/60"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
        >
          {matchup.p2_photo ? (
            <img src={matchup.p2_photo} className={`w-9 h-9 rounded-full object-cover shrink-0 border-2 transition-all
              ${isP2 ? "border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "border-slate-600"}`} alt={matchup.p2_name} />
          ) : (
            <div className={`w-9 h-9 rounded-full shrink-0 border-2 flex items-center justify-center text-sm bg-slate-700
              ${isP2 ? "border-purple-400" : "border-slate-600"}`}>⚽</div>
          )}
          <div className="min-w-0 flex-1 text-right">
            <p className={`text-[11px] font-black leading-tight truncate transition-colors
              ${isP2 ? "text-purple-300" : "text-white"}`}>
              {matchup.p2_name || "اللاعب الثاني"}
            </p>
            {isP2 && <p className="text-[9px] text-purple-400 font-bold">اخترت ✓</p>}
          </div>
        </button>

      </div>
    </div>
  );
};

// --- Podium Component ---
const Podium = ({ winners, isPvP }) => {
  if (!winners || winners.length === 0) return null;

  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  return (
    <div className="flex justify-center items-end gap-2 sm:gap-4 mt-12 mb-4">
      {/* 2nd Place */}
      {second && (
        <div className="flex flex-col items-center relative z-0">
          <div className="mb-2 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_15px_rgba(203,213,225,0.4)] mb-1 z-10 border-2 border-slate-400 shrink-0">
              🥈
            </div>
            <div className="text-white font-bold text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[100px] text-center">
              {second.teamName}
            </div>
            <div className={`text-xs sm:text-sm font-black ${isPvP ? "text-purple-400" : "text-[#22c55e]"}`}>
              {second.points ?? second.challengePoints ?? second.totalPoints ?? 0}
            </div>
          </div>
          <div className="w-20 sm:w-24 h-[100px] sm:h-[130px] bg-gradient-to-t from-slate-500/20 to-slate-400/40 border-t border-slate-300 rounded-t-lg shadow-inner flex justify-center items-start pt-2 shrink-0">
            <span className="text-slate-300 font-black text-2xl">2</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {first && (
        <div className="flex flex-col items-center z-10 -mx-1 sm:-mx-2">
          <div className="mb-2 flex flex-col items-center">
            <div className="relative shrink-0">
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl animate-bounce">
                👑
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_25px_rgba(250,204,21,0.6)] mb-1 border-2 border-yellow-200 z-10">
                🥇
              </div>
            </div>
            <div className="text-white font-black text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[120px] text-center mt-1">
              {first.teamName}
            </div>
            <div className={`text-sm sm:text-base font-black ${isPvP ? "text-purple-400" : "text-[#22c55e]"}`}>
              {first.points ?? first.challengePoints ?? first.totalPoints ?? 0}
            </div>
          </div>
          <div className="w-24 sm:w-28 h-[140px] sm:h-[180px] bg-gradient-to-t from-yellow-600/20 to-yellow-400/40 border-t-2 border-yellow-400 rounded-t-lg shadow-[0_0_30px_rgba(250,204,21,0.15)] flex justify-center items-start pt-2 shrink-0">
            <span className="text-yellow-400 font-black text-4xl drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">1</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div className="flex flex-col items-center relative z-0">
          <div className="mb-2 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-300 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_15px_rgba(251,146,60,0.4)] mb-1 z-10 border-2 border-orange-500 shrink-0">
              🥉
            </div>
            <div className="text-white font-bold text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[100px] text-center">
              {third.teamName}
            </div>
            <div className={`text-xs sm:text-sm font-black ${isPvP ? "text-purple-400" : "text-[#22c55e]"}`}>
              {third.points ?? third.challengePoints ?? third.totalPoints ?? 0}
            </div>
          </div>
          <div className="w-20 sm:w-24 h-[70px] sm:h-[90px] bg-gradient-to-t from-orange-700/20 to-orange-500/40 border-t border-orange-400 rounded-t-lg shadow-inner flex justify-center items-start pt-2 shrink-0">
            <span className="text-orange-400 font-black text-2xl">3</span>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Component: PvP Predictions Form (Compact) ---
const PvPPredictionForm = ({ challenge, user, onSubmit, isPending }) => {
  const [selections, setSelections] = useState({});

  const handleSelect = (matchupIndex, selection) => {
    setSelections((prev) => ({ ...prev, [matchupIndex]: selection }));
  };

  const handleSubmit = () => {
    const predictions = challenge.matchups.map((m, i) => ({
      matchupIndex: i,
      selection: selections[i] || null,
    }));
    if (predictions.some((p) => !p.selection)) {
      alert("الرجاء توقع نتيجة جميع المواجهات المتاحة!");
      return;
    }
    onSubmit(predictions);
  };

  const totalMatchups = challenge.matchups?.length || 0;
  const selectedCount = Object.keys(selections).length;

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-purple-500/30 p-4 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-black text-white">⚔️ توقع المواجهات</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">اختر الفائز في كل مواجهة</p>
        </div>
        <div className="text-left">
          <div className="bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-lg">
            <span className="text-purple-300 font-black text-sm">{selectedCount}</span>
            <span className="text-gray-500 text-xs font-bold">/{totalMatchups}</span>
          </div>
          <p className="text-[9px] text-gray-500 text-center mt-0.5">تم اختياره</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-700/50 rounded-full h-1 mb-3">
        <div
          className="bg-gradient-to-r from-purple-600 to-fuchsia-400 h-1 rounded-full transition-all duration-500"
          style={{ width: `${totalMatchups > 0 ? (selectedCount / totalMatchups) * 100 : 0}%` }}
        />
      </div>

      {/* Matchup Cards */}
      <div className="space-y-2">
        {challenge.matchups.map((matchup, idx) => (
          <MatchupCard
            key={idx}
            matchup={matchup}
            idx={idx}
            selection={selections[idx]}
            onSelect={handleSelect}
            disabled={challenge.status === "finished" || isPending}
          />
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || challenge.status === "finished"}
        className={`w-full mt-3 py-3 rounded-xl font-black text-sm transition-all duration-200 shadow-[0_8px_20px_rgba(168,85,247,0.25)]
          ${isPending || challenge.status === "finished"
            ? "bg-slate-700 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)] hover:scale-[1.01] active:scale-[0.99]"
          }`}
      >
        {isPending ? "جاري الإرسال..." : challenge.status === "finished" ? "🏁 التحدي انتهى" : "🚀 اعتمد التوقعات"}
      </button>
    </div>
  );
};

// --- Main Component ---
const ChallengePage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: user, isLoading: userLoading } = useUser();
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const enrollMutation = useEnrollChallenge();
  const { data: classicStandings, isLoading: classicStandingsLoading } = useChallengeStandings(id);
  const { data: pvpChallenges, isLoading: pvpLoading } = usePvPChallenges();
  const { data: pvpStandings, isLoading: pvpStandingsLoading } = usePvPStandings(id);
  const { mutate: submitPrediction, isPending: submitPredictionPending } = useSubmitPvPPrediction();

  const classicChallenge = challenges?.find((c) => c._id === id);
  const pvpChallengeMeta = pvpChallenges?.find((c) => c._id === id);
  const isPvP = !!pvpChallengeMeta;

  // Fetch enriched PvP challenge (with gwDeadlinePassed) only when it's a PvP challenge
  const { data: pvpChallengeDetail } = usePvPChallengeById(isPvP ? id : null);

  const pvpChallenge = pvpChallengeDetail || pvpChallengeMeta;

  const challenge = classicChallenge || pvpChallenge;

  // gwDeadlinePassed: true means GW has started — predictions are locked
  const gwDeadlinePassed = isPvP ? (pvpChallengeDetail?.gwDeadlinePassed ?? false) : false;

  const standings = isPvP ? pvpStandings : classicStandings;
  const standingsLoading = isPvP ? pvpStandingsLoading : classicStandingsLoading;

  const isJoinedClassic = !isPvP && user?.joinedChallenges?.some((c) => c.challengeId === id);
  const isJoinedPvP = isPvP && standings?.some((s) => s.userId === user?._id || s._id === user?._id);
  const isJoined = isPvP ? isJoinedPvP : isJoinedClassic;
  const requiresJoinCode = !!(challenge?.joinCode && challenge.joinCode.trim());

  const { currentItems, totalPages, currentUserEntry, currentUserRankIndex, isUserInCurrentPage } =
    useMemo(() => {
      const data = standings || [];
      const pages = Math.ceil(data.length / itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      const sliced = data.slice(start, start + itemsPerPage);
      const userIdx = data.findIndex((p) => p.userId === user?._id || p._id === user?._id);
      const userEntry = userIdx !== -1 ? data[userIdx] : null;
      const inCurrent = sliced.some((p) => p.userId === user?._id || p._id === user?._id);
      return {
        currentItems: sliced,
        totalPages: pages,
        currentUserEntry: userEntry,
        currentUserRankIndex: userIdx,
        isUserInCurrentPage: inCurrent,
      };
    }, [standings, currentPage, user]);

  const checks = {
    points: (user?.totalPoints || 0) >= (challenge?.minTotalPoints || 0),
    rank: (user?.overallRank || 9999999) <= (challenge?.maxOverallRank || 10000000),
    started: Number(user?.startedEvent || 0) <= Number(challenge?.minStartedEvent || 0),
    notEnded: (user?.currentEvent || 0) <= (challenge?.endEvent || 0),
  };
  // For PvP: deadline check overrides notEnded — block if GW already started
  if (isPvP) checks.notEnded = !gwDeadlinePassed;

  const canEnroll = Object.values(checks).every(Boolean) && !isJoined && challenge?.status === "active";

  const doEnroll = (payload = {}) => {
    const options = {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
        setShowJoinModal(false);
        setJoinCodeInput("");
        alert(res?.data?.message || res?.message || "تم الانضمام بنجاح! بالتوفيق يا بطل 🚀");
      },
      onError: (err) => {
        alert(err.response?.data?.message || "عذراً، فشل الانضمام للتحدي");
      },
    };
    if (payload.joinCode !== undefined) {
      enrollMutation.mutate({ id, joinCode: payload.joinCode }, options);
    } else {
      enrollMutation.mutate({ id }, options);
    }
  };

  const handleEnroll = () => {
    if (requiresJoinCode) { setJoinCodeInput(""); setShowJoinModal(true); return; }
    if (window.confirm("هل تريد الانضمام لهذا التحدي؟")) doEnroll();
  };

  const handleJoinModalSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    doEnroll({ joinCode: joinCodeInput.trim() });
  };

  const handlePvPSubmit = (predictions) => {
    submitPrediction({ id, predictions }, {
      onSuccess: () => {
        alert("تم إرسال توقعاتك بنجاح! حظاً موفقاً ⚔️");
        queryClient.invalidateQueries({ queryKey: ["pvpStandings", id] });
      },
      onError: (err) => {
        alert(err.response?.data?.message || "عذراً، حدث خطأ أثناء الحفظ");
      },
    });
  };

  // --- Theme ---
  const themePrimaryClass = isPvP ? "bg-purple-500" : "bg-[#22c55e]";
  const themeTextClass = isPvP ? "text-purple-400" : "text-[#22c55e]";
  const themeBorderClass = isPvP ? "border-purple-500/40" : "border-[#22c55e]/40";
  const themeGlowColor = isPvP ? "rgba(168,85,247,0.15)" : "rgba(34,197,94,0.15)";
  const themeGradientClass = isPvP ? "from-purple-600 to-fuchsia-500" : "from-[#22c55e] to-[#18f0c0]";

  if (userLoading || challengesLoading || pvpLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center text-white font-bold animate-pulse text-base">
          جاري استدعاء بيانات البطولة...
        </div>
      </Layout>
    );
  }

  if (!challenge) {
    return (
      <Layout>
        <div className="text-center p-10 text-white font-black">❌ هذا التحدي غير موجود.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-3 sm:px-5 py-4 sm:py-6" dir="rtl">
        <div className="max-w-2xl mx-auto text-white">

          {/* ═══════════════════════════════════════════════
              COMPACT GLASSMORPHISM HEADER BANNER
          ═══════════════════════════════════════════════ */}
          <div
            className={`relative rounded-2xl border ${themeBorderClass} bg-slate-800/60 backdrop-blur-xl overflow-hidden mb-3`}
            style={{
              boxShadow: `0 0 15px ${themeGlowColor}`,
              ...(challenge.backgroundImage && {
                backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.93), rgba(15,23,42,0.88)), url(${challenge.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }),
            }}
          >
            {/* Status ribbon */}
            {challenge.status === "finished" && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-300" />
            )}
            {isPvP && challenge.status !== "finished" && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-400" />
            )}

            <div className="p-3.5 sm:p-5">
              {/* Top row: image + title + badges */}
              <div className="flex items-start gap-3">

                {/* Challenge Image — compact circle */}
                <div className="relative shrink-0">
                  {challenge.image ? (
                    <img
                      src={challenge.image}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 ${themeBorderClass}`}
                      alt={challenge.title}
                    />
                  ) : (
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 ${themeBorderClass} bg-slate-700/60 flex items-center justify-center text-2xl`}>
                      {isPvP ? "⚔️" : "🏆"}
                    </div>
                  )}
                  {isJoined && (
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-slate-900"
                      style={{ background: `linear-gradient(135deg, ${isPvP ? "#a855f7, #c084fc" : "#22c55e, #18f0c0"})` }}
                    >
                      ✓
                    </div>
                  )}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-base sm:text-xl font-black tracking-tight leading-tight text-white truncate">
                      {challenge.title}
                    </h1>
                    {/* Status badge */}
                    {challenge.status === "finished" ? (
                      <span className="shrink-0 text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">🏁 انتهى</span>
                    ) : isPvP ? (
                      <span className="shrink-0 text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">⚔️ PvP</span>
                    ) : (
                      <span className="shrink-0 text-[9px] font-black bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 px-2 py-0.5 rounded-full">🟢 نشط</span>
                    )}
                  </div>

                  {/* Inline info badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* GW Badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-700/80 ${themeTextClass} border ${themeBorderClass}`}>
                      📅 {isPvP ? `GW ${challenge.gw}` : `GW ${challenge.startEvent}–${challenge.endEvent}`}
                    </span>

                    {/* Prize 1st */}
                    {challenge.prize && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        🥇 {challenge.prize}
                      </span>
                    )}

                    {/* Prize 2nd */}
                    {challenge.prizeSecond && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-700/80 text-slate-300 border border-slate-600/50">
                        🥈 {challenge.prizeSecond}
                      </span>
                    )}

                    {/* Prize 3rd */}
                    {challenge.prizeThird && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        🥉 {challenge.prizeThird}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {challenge.description && (
                <div className="mt-3 bg-slate-900/40 rounded-xl p-2.5 border border-white/5">
                  <TextWithLinks
                    text={challenge.description}
                    className="text-gray-400 text-[11px] leading-relaxed"
                  />
                </div>
              )}

              {/* Eligibility conditions (only if not joined + active) */}
              {challenge.status === "active" && !isJoined && (
                <div className="mt-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    {isPvP ? "شروط التوقع:" : "شروط التأهل:"}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {!isPvP ? (
                      <>
                        <ConditionItem label={`النقاط: +${challenge.minTotalPoints}`} isMet={checks.points} />
                        <ConditionItem label={`الترتيب: تحت #${challenge.maxOverallRank?.toLocaleString()}`} isMet={checks.rank} />
                        <ConditionItem label={`بدءاً من: GW ${challenge.minStartedEvent}`} isMet={checks.started} />
                        <ConditionItem label={`مستمر حتى: GW ${challenge.endEvent}`} isMet={checks.notEnded} />
                      </>
                    ) : (
                      <ConditionItem label={`مفتوح قبل انتهاء وقت التوقع GW ${challenge.gw}`} isMet={checks.notEnded} />
                    )}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="mt-3">
                {challenge.status === "finished" ? (
                  <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-black">
                    🏅 تم إغلاق التحدي
                  </div>
                ) : isJoined ? (
                  <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 py-3 rounded-xl text-xs font-black border ${themeBorderClass}`}
                    style={{ background: isPvP ? "rgba(168,85,247,0.1)" : "rgba(34,197,94,0.1)" }}>
                    <span className={themeTextClass}>✅ {isPvP ? "لقد توقعت المعركة" : "أنت في المنافسة"}</span>
                    {isPvP && (
                      <Link
                        to={`/challenge/${id}/my-prediction`}
                        className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white rounded-lg transition-all border border-purple-500/40"
                      >
                        انظر الي اختياراتك 👀
                      </Link>
                    )}
                  </div>
                ) : !isPvP ? (
                  <button
                    onClick={handleEnroll}
                    disabled={!canEnroll || enrollMutation.isPending}
                    className={`w-full py-2.5 rounded-xl font-black text-sm transition-all duration-200
                      ${canEnroll
                        ? `bg-gradient-to-r ${themeGradientClass} text-white hover:scale-[1.01] active:scale-[0.99]`
                        : "bg-slate-700 text-gray-500 cursor-not-allowed"
                      }`}
                    style={canEnroll ? { boxShadow: `0 6px 20px ${themeGlowColor}` } : {}}
                  >
                    {enrollMutation.isPending ? "جاري التسجيل..." : "🚀 سجل الآن مجاناً"}
                  </button>
                ) : (
                  gwDeadlinePassed ? (
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                      ⏰ انتهى وقت التوقع — الجولة بدأت
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold">
                      👇 توقع المواجهات بالأسفل للانضمام
                    </div>
                  )
                )}
              </div>

              {/* PvP Rules Link */}
              {isPvP && (
                <div className="mt-3">
                  <Link
                    to="/pvp-rules"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all text-xs sm:text-sm font-black shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-[0.98]"
                  >
                    📖 شرح النقاط وقواعد المعارك
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              PvP PREDICTIONS FORM (Compact Matchup Cards)
          ═══════════════════════════════════════════════ */}
          {isPvP && !isJoinedPvP && (
            gwDeadlinePassed ? (
              // GW has started — show locked banner + standings only
              <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-amber-500/30 p-5 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.06)] text-center">
                <div className="text-3xl mb-2">⏰</div>
                <h3 className="text-white font-black text-sm mb-1">انتهى وقت التوقع</h3>
                <p className="text-gray-400 text-xs">
                  الجولة <span className="text-amber-400 font-bold">GW {challenge?.gw}</span> بدأت بالفعل — باب التوقعات مغلق.
                </p>
              </div>
            ) : (
              <PvPPredictionForm
                challenge={challenge}
                user={user}
                onSubmit={handlePvPSubmit}
                isPending={submitPredictionPending}
              />
            )
          )}

          {/* ═══════════════════════════════════════════════
              STANDINGS TABLE & PODIUM
          ═══════════════════════════════════════════════ */}
          {(!isPvP || isJoinedPvP) && (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden mt-3">

              {/* Podium (Shown only when Challenge is finished) */}
              {challenge.status === "finished" && !standingsLoading && (
                <div className="pt-6 pb-2 border-b border-slate-800/50 bg-slate-800/20">
                  <h2 className="text-center font-black text-xl text-white mb-2">تتويج الأبطال 🏆</h2>
                  <Podium winners={challenge.winners?.length > 0 ? challenge.winners : (!standingsLoading ? standings?.slice(0, 3) : [])} isPvP={isPvP} />
                </div>
              )}

              {/* Table header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
                <div>
                  <h2 className="text-sm font-black text-white tracking-tight">
                    {challenge.status === "finished" ? "الترتيب النهائي 📊" : "جدول الترتيب 📊"}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    {challenge.status === "finished" ? "الترتيب الكامل للمشاركين" : "يتحدث كل ساعتين"}
                  </p>
                </div>
                {challenge.status === "active" && (
                  <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                    <span className={`w-1.5 h-1.5 ${themePrimaryClass} rounded-full animate-pulse`} />
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">مباشر</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[280px]">
                  <thead>
                    <tr className="bg-slate-900/50 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                      <th className="p-2.5 sm:p-4 w-12 text-center">المركز</th>
                      <th className="p-2.5 sm:p-4">الفريق / الكابتن</th>
                      <th className="p-2.5 sm:p-4 text-center">{isPvP ? "نقاط المعركة" : "نقاط التحدي"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {standingsLoading ? (
                      <tr>
                        <td colSpan="3" className="p-10 text-center animate-pulse text-gray-500 font-bold text-sm">
                          جاري تحميل الترتيب...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {currentItems.map((player, index) => (
                          <PlayerRow
                            key={player._id || player.userId}
                            player={player}
                            index={(currentPage - 1) * itemsPerPage + index}
                            isCurrentUser={player.userId === user?._id || player._id === user?._id}
                            isPvP={isPvP}
                          />
                        ))}
                        {isJoined && !isUserInCurrentPage && currentUserEntry && (
                          <>
                            <tr className="bg-slate-950/40">
                              <td colSpan="3" className="py-1 text-center text-slate-700 text-[9px] font-black tracking-[0.3em]">
                                •••
                              </td>
                            </tr>
                            <PlayerRow
                              player={currentUserEntry}
                              index={currentUserRankIndex}
                              isCurrentUser={true}
                              isSticky={true}
                              isPvP={isPvP}
                            />
                          </>
                        )}
                      </>
                    )}
                  </tbody>
                </table>

                {!currentItems.length && !standingsLoading && (
                  <div className="p-10 text-center flex flex-col items-center gap-2">
                    <div className="text-3xl grayscale opacity-40">🏟️</div>
                    <p className="text-gray-500 text-xs font-bold">الساحة فاضية! كن أول المنضمين.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-800 flex justify-between items-center gap-2 bg-slate-900/50" dir="ltr">
                  <button
                    onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: "smooth" }); }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-30 text-xs font-bold hover:bg-slate-700 transition-all"
                  >
                    Prev
                  </button>
                  <div className="flex gap-1 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[...Array(totalPages)].map((_, i) => {
                      if (window.innerWidth < 640 && Math.abs(currentPage - (i + 1)) > 1 && i !== 0 && i !== totalPages - 1) {
                        if (Math.abs(currentPage - (i + 1)) === 2) return <span key={i} className="text-gray-600 px-1 text-xs">.</span>;
                        return null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 400, behavior: "smooth" }); }}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all shrink-0
                            ${currentPage === i + 1
                              ? `${themePrimaryClass} text-white scale-110 shadow-md`
                              : "bg-slate-800 text-gray-400 hover:text-white"
                            }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: "smooth" }); }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-30 text-xs font-bold hover:bg-slate-700 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Join Code Modal */}
      {showJoinModal && requiresJoinCode && !isPvP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowJoinModal(false)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full p-5 text-right" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-white mb-1">كود الانضمام 🔐</h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">هذا التحدي خاص ويحتاج إلى كود للانضمام.</p>
            <form onSubmit={handleJoinModalSubmit}>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="أدخل الكود هنا..."
                className="w-full bg-slate-800/50 p-3 rounded-xl border border-slate-600 focus:border-[#22c55e] focus:bg-slate-800 transition-all outline-none text-white font-bold mb-4 text-center text-base tracking-widest"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-700 text-gray-400 hover:bg-slate-800 transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={!joinCodeInput.trim() || enrollMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#22c55e] text-[#04120A] shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50">
                  {enrollMutation.isPending ? "جاري..." : "تأكيد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ChallengePage;