import React from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { usePvPChallengeById, useMyPvPPrediction } from "../hooks/useAuthQuery";

const PredictionCard = ({ matchup, selection, idx }) => {
  const isP1 = selection === "p1";
  const isDraw = selection === "draw";
  const isP2 = selection === "p2";

  return (
    <div className="relative bg-slate-900/70 rounded-2xl border border-purple-500/30 overflow-hidden shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:-translate-y-1">
      {/* 2X badge */}
      {matchup.isDouble && (
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full shadow-lg border border-orange-400 flex items-center gap-1 animate-[pulse_2s_ease-in-out_infinite]">
          <span>🔥</span> Double (6 نقاط)
        </div>
      )}

      {/* Match number */}
      <div className="absolute top-2 right-3 text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
        مواجهة #{idx + 1}
      </div>

      <div className="p-4 sm:p-5 mt-6">
        <div className="flex items-center gap-2 justify-between">
          
          {/* Player 1 */}
          <div className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isP1 ? "bg-purple-500/20 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "bg-slate-800/40 border border-transparent grayscale-[30%] opacity-70"}`}>
            {matchup.p1_photo ? (
              <img src={matchup.p1_photo} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 border-2 ${isP1 ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] scale-110" : "border-slate-600"}`} alt={matchup.p1_name} />
            ) : (
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0 border-2 flex items-center justify-center text-xl sm:text-2xl bg-slate-700 ${isP1 ? "border-purple-400 scale-110" : "border-slate-600"}`}>⚽</div>
            )}
            <div className="text-center">
              <p className={`text-xs sm:text-sm font-black leading-tight ${isP1 ? "text-purple-300" : "text-white"}`}>
                {matchup.p1_name || "اللاعب الأول"}
              </p>
              {isP1 && <p className="text-[10px] sm:text-xs text-purple-400 font-bold mt-1 bg-purple-500/20 px-2 py-0.5 rounded-full inline-block">✓ اختيارك</p>}
            </div>
          </div>

          {/* Center: VS + Draw */}
          <div className="flex flex-col items-center gap-2 shrink-0 px-2 sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest bg-slate-800 px-2 py-1 rounded-md border border-slate-700">vs</span>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full font-black text-[10px] sm:text-xs uppercase transition-all flex items-center justify-center border-2 leading-tight ${isDraw ? "bg-gradient-to-br from-slate-400 to-slate-600 border-slate-300 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)] scale-110" : "bg-slate-800/40 border-slate-700 text-gray-500 opacity-60"}`}>
              تعادل
            </div>
            {isDraw && <span className="text-[10px] sm:text-xs text-slate-300 font-black">✓ اختيارك</span>}
          </div>

          {/* Player 2 */}
          <div className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isP2 ? "bg-purple-500/20 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "bg-slate-800/40 border border-transparent grayscale-[30%] opacity-70"}`}>
            {matchup.p2_photo ? (
              <img src={matchup.p2_photo} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 border-2 ${isP2 ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] scale-110" : "border-slate-600"}`} alt={matchup.p2_name} />
            ) : (
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0 border-2 flex items-center justify-center text-xl sm:text-2xl bg-slate-700 ${isP2 ? "border-purple-400 scale-110" : "border-slate-600"}`}>⚽</div>
            )}
            <div className="text-center">
              <p className={`text-xs sm:text-sm font-black leading-tight ${isP2 ? "text-purple-300" : "text-white"}`}>
                {matchup.p2_name || "اللاعب الثاني"}
              </p>
              {isP2 && <p className="text-[10px] sm:text-xs text-purple-400 font-bold mt-1 bg-purple-500/20 px-2 py-0.5 rounded-full inline-block">اختيارك ✓</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const PvPPredictionsPage = () => {
  const { id } = useParams();
  const { data: challenge, isLoading: challengeLoading } = usePvPChallengeById(id);
  const { data: myPrediction, isLoading: predictionLoading } = useMyPvPPrediction(id);

  if (challengeLoading || predictionLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center text-white font-bold animate-pulse text-base">
          جاري تجهيز ملخص اختياراتك... ⚔️
        </div>
      </Layout>
    );
  }

  if (!challenge || !myPrediction) {
    return (
      <Layout>
        <div className="text-center p-10 text-white font-black mt-20">
          <div className="text-4xl mb-4">❌</div>
          <p>لم يتم العثور على توقعاتك لهذا التحدي.</p>
          <div className="flex justify-center mt-6">
            <Link to={`/challenges/${id}`} className="px-6 py-3 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/40 rounded-xl font-black transition-all">العودة للتحدي</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-3 sm:px-5 py-6 sm:py-10 min-h-screen" dir="rtl">
        <div className="max-w-4xl mx-auto text-white">

          {/* Header */}
          <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.08)] p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-700 via-fuchsia-500 to-purple-700 mb-2" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border-2 border-purple-400 rounded-full flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              🎯
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white tracking-tight">
              ملخص توقعاتك لمعركة
            </h1>
            <h2 className="text-xl sm:text-2xl font-black text-purple-400 tracking-tighter mb-4">
              "{challenge.title}"
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="inline-flex items-center gap-2 bg-slate-900/60 border border-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-300">
                📅 الجولة (GW): {challenge.gw}
              </span>
              <span className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-purple-300">
                ⚔️ {challenge.matchups.length} مواجهات
              </span>
            </div>
            
            {challenge.status === "finished" && (
               <div className="mt-5 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-xl text-sm font-black">
                 🏁 التحدي مُنتهي
               </div>
            )}
          </div>

          {/* Matchups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
            {challenge.matchups.map((matchup, idx) => {
              // Find prediction for this matchup
              const pred = myPrediction.predictions.find(p => p.matchupIndex === idx);
              const selection = pred ? pred.selection : null;
              
              return (
                <PredictionCard 
                  key={idx}
                  matchup={matchup}
                  idx={idx}
                  selection={selection}
                />
              );
            })}
          </div>

          {/* Action */}
          <div className="text-center">
             <Link 
                to={`/challenges/${id}`} 
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-white font-black rounded-2xl border border-slate-600 hover:border-purple-400 hover:bg-slate-700 transition-all shadow-lg active:scale-95"
             >
                ⬅️ العودة إلى التحدي
             </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default PvPPredictionsPage;
