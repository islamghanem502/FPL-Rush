import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import {
  useChallenges,
  useEnrollChallenge,
  useChallengeStandings,
  useUser,
} from "../hooks/useAuthQuery";

// Helper: parse text and make URLs clickable
const TextWithLinks = ({ text, className }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const lines = text.split("\n");
  return (
    <div className={className}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(urlRegex);
        return (
          <span key={lineIdx} className="block mb-2 last:mb-0">
            {parts.map((part, i) =>
              urlRegex.test(part) ? (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] underline underline-offset-4 hover:text-white transition-all duration-300"
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

const ChallengePage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  const { data: user, isLoading: userLoading } = useUser();
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: standings, isLoading: standingsLoading } = useChallengeStandings(id);
  const enrollMutation = useEnrollChallenge();

  const challenge = challenges?.find((c) => c._id === id);
  const isJoined = user?.joinedChallenges?.some((c) => c.challengeId === id);
  const requiresJoinCode = !!(challenge?.joinCode && challenge.joinCode.trim());

  const checks = {
    points: (user?.totalPoints || 0) >= (challenge?.minTotalPoints || 0),
    rank: (user?.overallRank || 9999999) <= (challenge?.maxOverallRank || 10000000),
    started: (user?.playerStartedEvent || 1) <= (challenge?.minStartedEvent || 38),
    notEnded: (user?.currentEvent || 0) <= (challenge?.endEvent || 0),
  };

  const canEnroll =
    Object.values(checks).every(Boolean) &&
    !isJoined &&
    challenge?.status === "active";

  const doEnroll = (payload = {}) => {
    const options = {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
        setShowJoinModal(false);
        setJoinCodeInput("");
        const msg = res?.data?.message || res?.message;
        alert(msg || "تم الانضمام بنجاح! بالتوفيق يا بطل 🚀");
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
    if (requiresJoinCode) {
      setJoinCodeInput("");
      setShowJoinModal(true);
      return;
    }
    if (
      window.confirm(
        "هل تريد الانضمام لهذا التحدي؟ سيتم احتساب نقاطك بدءاً من هذه اللحظة."
      )
    ) {
      doEnroll();
    }
  };

  const handleJoinModalSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    doEnroll({ joinCode: joinCodeInput.trim() });
  };

  if (userLoading || challengesLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center text-white font-bold animate-pulse italic text-xl">
          جاري استدعاء بيانات البطولة...
        </div>
      </Layout>
    );
  }

  if (!challenge) {
    return (
      <Layout>
        <div className="text-center p-20 text-white font-black">
          ❌ هذا التحدي غير موجود.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
        <div className="max-w-6xl mx-auto text-white text-right" dir="rtl">
          
          {/* Challenge Header Card */}
          <div
            className={`rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 border ${
              challenge.status === "finished"
                ? "border-yellow-500/30 shadow-yellow-500/10"
                : "border-white/10 shadow-2xl"
            } mb-8 sm:mb-12 relative overflow-hidden bg-slate-900/60 backdrop-blur-xl`}
            style={
              challenge.backgroundImage
                ? {
                    backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.85)), url(${challenge.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {challenge.status === "finished" && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-black font-black px-8 sm:px-12 py-2 rotate-45 translate-x-8 sm:translate-x-10 translate-y-6 shadow-xl z-20 italic text-sm">
                🏆 انتهى
              </div>
            )}

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12">
              
              {/* Image & Prizes Sidebar */}
              <div className="flex flex-col items-center lg:items-start gap-6 w-full lg:w-1/3 shrink-0">
                <div className="relative group w-40 sm:w-48 h-40 sm:h-48">
                  <img
                    src={challenge.image}
                    className="w-full h-full rounded-[2rem] object-cover border-4 border-[#22c55e]/30 shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-transform duration-500 group-hover:scale-105"
                    alt={challenge.title}
                  />
                  {isJoined && (
                    <div
                      className="absolute -top-4 -right-4 font-black px-4 py-2 rounded-2xl shadow-lg rotate-12 text-sm z-10"
                      style={{
                        background: "linear-gradient(135deg, rgba(34,197,94,1), rgba(24,240,192,1))",
                        color: "#04120A",
                      }}
                    >
                      Joined
                    </div>
                  )}
                </div>

                <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 p-5 sm:p-6 w-full text-center lg:text-right space-y-3 rounded-[1.5rem] shadow-inner">
                  <p className="text-gray-400 text-xs font-black uppercase mb-2 tracking-widest">
                    الجوائز 🎁
                  </p>
                  {challenge.prize && (
                    <p className="text-lg sm:text-xl font-black text-[#22c55e] flex items-center justify-center lg:justify-start gap-2">
                      <span className="text-2xl drop-shadow-md">🥇</span> 
                      <span>المركز الأول: {challenge.prize}</span>
                    </p>
                  )}
                  {challenge.prizeSecond && (
                    <p className="text-slate-300 text-sm sm:text-base font-bold flex items-center justify-center lg:justify-start gap-2">
                      <span className="text-xl drop-shadow-md">🥈</span> 
                      <span>المركز الثاني: {challenge.prizeSecond}</span>
                    </p>
                  )}
                  {challenge.prizeThird && (
                    <p className="text-amber-600 text-sm sm:text-base font-bold flex items-center justify-center lg:justify-start gap-2">
                      <span className="text-xl drop-shadow-md">🥉</span> 
                      <span>المركز الثالث: {challenge.prizeThird}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Challenge Details Content */}
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <h1 className="text-2xl sm:text-4xl md:text-6xl font-black italic tracking-tighter leading-tight mb-2 sm:mb-4 drop-shadow-md break-words">
                  {challenge.title}
                </h1>
                <br />


                {/* Description Container */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-[1.5rem] p-4 sm:p-6 mb-6 sm:mb-8">
                  <TextWithLinks
                    text={challenge.description}
                    className="text-gray-300 font-medium leading-relaxed text-sm sm:text-base md:text-lg break-words"
                  />
                </div>

                {/* Conditions Check */}
                {challenge.status === "active" && !isJoined && (
                  <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 p-4 sm:p-6 rounded-[1.5rem] mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <h3 className="col-span-full text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">
                      شروط التأهل للتحدي:
                    </h3>
                    <ConditionItem label={`النقاط المطلوبة: +${challenge.minTotalPoints}`} isMet={checks.points} />
                    <ConditionItem label={`الترتيب المطلوب: تحت #${challenge.maxOverallRank?.toLocaleString()}`} isMet={checks.rank} />
                    <ConditionItem label={`بدء من جولة: ${challenge.minStartedEvent}`} isMet={checks.started} />
                    <ConditionItem label={`مستمر حتى جولة: ${challenge.endEvent}`} isMet={checks.notEnded} />
                  </div>
                )}

                {/* Actions & Dates */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                  {challenge.status === "finished" ? (
                    <div className="bg-yellow-500/10 text-yellow-500 px-6 sm:px-8 py-4 rounded-2xl font-black border border-yellow-500/20 flex items-center justify-center gap-3 w-full sm:w-auto">
                      <span className="text-2xl">🏅</span> 
                      <span>تم إغلاق التحدي</span>
                    </div>
                  ) : isJoined ? (
                    <div className="bg-[#22c55e]/10 text-[#22c55e] px-6 sm:px-8 py-4 rounded-2xl font-black border border-[#22c55e]/20 flex items-center justify-center gap-3 w-full sm:w-auto">
                      <span className="text-2xl">✅</span> 
                      <span>أنت في المنافسة</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={!canEnroll || enrollMutation.isPending}
                      className={`px-8 py-4 rounded-2xl font-black text-base sm:text-lg transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-3
                      ${
                        canEnroll
                          ? "hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(34,197,94,0.3)]"
                          : "bg-slate-800 text-gray-500 cursor-not-allowed opacity-60 border border-slate-700"
                      }`}
                      style={
                        canEnroll
                          ? {
                              background: "linear-gradient(135deg, rgba(34,197,94,1), rgba(24,240,192,1))",
                              color: "#04120A",
                            }
                          : undefined
                      }
                    >
                      {enrollMutation.isPending ? "جاري التسجيل..." : "سجل الآن مجاناً 🚀"}
                    </button>
                  )}

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 px-6 py-4 rounded-2xl w-full sm:w-auto text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      الفترة الزمنية
                    </p>
                    <p className="font-black text-white text-base sm:text-xl uppercase tracking-widest">
                      GW {challenge.startEvent} — {challenge.endEvent}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Podium Section (If Finished) */}
          {challenge.status === "finished" && challenge.winners && (
            <div className="mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-10 sm:mb-16 italic tracking-widest uppercase drop-shadow-lg">
                لوحة الشرف 🏆
              </h2>
              <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-6">
                {/* 2nd Place */}
                {challenge.winners[1] && (
                  <div className="w-full sm:w-64 bg-slate-800/80 p-6 sm:p-8 rounded-3xl border-t-4 border-slate-400 text-center order-2 sm:order-1 h-auto sm:h-64 flex flex-col justify-center shadow-2xl relative mt-10 sm:mt-0 backdrop-blur-md">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-slate-400 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-slate-900">
                      🥈
                    </div>
                    <h3 className="font-black text-white text-lg sm:text-xl truncate mt-4">
                      {challenge.winners[1].teamName}
                    </h3>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">
                      {challenge.winners[1].managerName}
                    </p>
                    <div className="mt-4 text-slate-300 font-black text-2xl tracking-tighter">
                      {challenge.winners[1].points} PTS
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {challenge.winners[0] && (
                  <div className="w-full sm:w-72 bg-gradient-to-b from-slate-800 to-slate-900 p-8 sm:p-10 rounded-3xl border-t-8 border-yellow-500 text-center order-1 sm:order-2 h-auto sm:h-80 flex flex-col justify-center shadow-[0_0_50px_rgba(234,179,8,0.15)] relative z-10 mt-12 sm:mt-0">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-5xl shadow-2xl border-4 border-slate-900 animate-bounce">
                      👑
                    </div>
                    <h3 className="font-black text-white text-xl sm:text-2xl truncate mt-6">
                      {challenge.winners[0].teamName}
                    </h3>
                    <p className="text-yellow-500 text-xs font-black uppercase tracking-widest mt-1">
                      {challenge.winners[0].managerName}
                    </p>
                    <div className="mt-6 text-yellow-500 font-black text-4xl sm:text-5xl tracking-tighter drop-shadow-md">
                      {challenge.winners[0].points} PTS
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {challenge.winners[2] && (
                  <div className="w-full sm:w-64 bg-slate-800/80 p-6 sm:p-8 rounded-3xl border-t-4 border-amber-700 text-center order-3 h-auto sm:h-56 flex flex-col justify-center shadow-2xl relative mt-10 sm:mt-0 backdrop-blur-md">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-slate-900">
                      🥉
                    </div>
                    <h3 className="font-black text-white text-lg sm:text-xl truncate mt-4">
                      {challenge.winners[2].teamName}
                    </h3>
                    <p className="text-amber-600 text-xs font-bold uppercase mt-1">
                      {challenge.winners[2].managerName}
                    </p>
                    <div className="mt-4 text-amber-600 font-black text-2xl tracking-tighter">
                      {challenge.winners[2].points} PTS
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Standings Table Section */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden relative">
            <div className="p-6 sm:p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/30 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {challenge.status === "finished" ? "الترتيب النهائي 🏁" : "جدول الترتيب 📊"}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm font-medium mt-2">
                  {challenge.status === "finished" ? "انتهت المنافسة وتم اعتماد النتائج" : "يتم احتساب النقاط وتحديثها مباشرة"}
                </p>
              </div>
              {challenge.status === "active" && (
                <div className="flex items-center gap-3 bg-slate-950/50 px-5 py-2.5 rounded-full border border-slate-700/50">
                  <span className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                  <span className="text-xs text-gray-300 font-black uppercase tracking-widest">
                    تحديث مباشر
                  </span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-gray-400 text-xs sm:text-sm font-black uppercase tracking-widest border-b border-slate-800">
                    <th className="p-4 sm:p-6 whitespace-nowrap">الترتيب</th>
                    <th className="p-4 sm:p-6 min-w-[150px]">الفريق / الكابتن</th>
                    <th className="p-4 sm:p-6 text-center whitespace-nowrap">نقاط التحدي</th>
                    <th className="p-4 sm:p-6 text-center whitespace-nowrap">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {standingsLoading ? (
                    <tr>
                      <td colSpan="4" className="p-16 sm:p-24 text-center animate-pulse text-gray-500 font-black text-lg">
                        جاري تحميل الترتيب...
                      </td>
                    </tr>
                  ) : (
                    (challenge.status === "finished" ? challenge.winners : standings)?.map((player, index) => (
                      <tr
                        key={player._id || player.userId}
                        className={`hover:bg-slate-800/40 transition-colors group ${
                          player.userId === user?._id || player._id === user?._id ? "bg-[#22c55e]/5" : ""
                        }`}
                      >
                        <td className="p-4 sm:p-6">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110
                            ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-yellow-500/20"
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
                        <td className="p-4 sm:p-6">
                          <div className="font-black text-sm sm:text-lg text-white group-hover:text-[#22c55e] transition-colors truncate">
                            {player.teamName}
                          </div>
                          <div className="text-xs text-gray-500 font-bold mt-1 truncate">
                            {player.managerName}
                          </div>
                        </td>
                        <td className="p-4 sm:p-6 text-center">
                          <div className={`font-black text-xl sm:text-3xl tracking-tighter ${index < 3 ? "text-[#22c55e]" : "text-white"}`}>
                            {player.points || player.challengePoints || 0}
                          </div>
                        </td>
                        <td className="p-4 sm:p-6 text-center text-gray-500 font-mono text-sm sm:text-base">
                          {player.totalPoints?.toLocaleString() || "---"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {(!standings || standings.length === 0) && !standingsLoading && challenge.status === "active" && (
                <div className="p-16 sm:p-24 text-center flex flex-col items-center justify-center gap-4">
                  <div className="text-5xl sm:text-6xl grayscale opacity-50">🏟️</div>
                  <p className="text-gray-500 font-black text-base sm:text-lg">
                    الساحة فاضية! كن أول المنضمين للمنافسة.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Join Code Modal */}
          {showJoinModal && requiresJoinCode && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowJoinModal(false)}
            >
              <div
                className="bg-slate-900 rounded-[2rem] border border-slate-700 shadow-2xl max-w-md w-full p-6 sm:p-8 text-right"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                  كود الانضمام 🔐
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  هذا التحدي خاص ويحتاج إلى كود. يرجى إدخال الكود السري للبدء.
                </p>
                <form onSubmit={handleJoinModalSubmit}>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="أدخل الكود هنا..."
                    className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-600 focus:border-[#22c55e] focus:bg-slate-800 transition-all outline-none text-white font-bold mb-6 text-center text-lg tracking-widest"
                    autoFocus
                  />
                  <div className="flex gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="flex-1 py-3 sm:py-4 rounded-xl font-bold border border-slate-700 text-gray-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={!joinCodeInput.trim() || enrollMutation.isPending}
                      className="flex-1 py-3 sm:py-4 rounded-xl font-black bg-[#22c55e] text-[#04120A] hover:bg-[#1fdb65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    >
                      {enrollMutation.isPending ? "جاري..." : "تأكيد"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

const ConditionItem = ({ label, isMet }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-white/5">
    <div
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform duration-300 shadow-sm shrink-0
      ${
        isMet
          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 scale-105"
          : "bg-red-500/10 text-red-500 border border-red-500/20"
      }`}
    >
      {isMet ? "✓" : "✕"}
    </div>
    <span className={`text-sm font-bold ${isMet ? "text-gray-200" : "text-gray-500"}`}>
      {label}
    </span>
  </div>
);

export default ChallengePage;