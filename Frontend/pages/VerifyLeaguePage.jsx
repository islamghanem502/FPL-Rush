import React, { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const VerifyLeaguePage = () => {
  const { updateUserInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const LEAGUE_CODE = "jv1xxz";

  const handleCopy = () => {
    navigator.clipboard.writeText(LEAGUE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-league");

      if (response.data.success) {
        updateUserInfo({
          isVerified: true,
          teamName: response.data.user.teamName,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "لم نجد فريقك في الدوري، تأكد من الانضمام أولاً";
      setError(msg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4 leading-relaxed">
      <div className="max-w-lg w-full bg-slate-800 border-2 border-slate-700 rounded-[45px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        <div className="text-center relative z-10">
          <h1 className="text-4xl font-black mb-6 italic tracking-tighter uppercase">
            توثيق <span className="text-[#22c55e]">الحساب</span>
          </h1>

          {/* شرح الإجراء - جعلته أبرز وأكبر */}
          <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl p-6 mb-8 shadow-inner">
            <p className="text-gray-200 text-base font-bold leading-relaxed tracking-tight">
              ⚠️ هذا الإجراء ضروري لربط حسابك ببيانات الفانتزي الرسمية، والتأكد من هويتك كمدرب حقيقي لضمان <span className="text-[#22c55e]">عدالة المنافسة وتوزيع الجوائز</span>.
            </p>
          </div>

          {/* صندوق الكود والنسخ */}
          <div className="bg-slate-900 border-2 border-slate-700 rounded-[30px] p-8 mb-8 relative group transition-all hover:border-[#22c55e]/50">
            <span className="text-xs text-gray-500 block mb-3 uppercase font-black tracking-[0.3em]">
              كود الدوري الرسمي
            </span>
            <code className="text-5xl font-mono font-black text-[#22c55e] block mb-6 tracking-widest selection:bg-[#22c55e] selection:text-slate-900">
              {LEAGUE_CODE}
            </code>
            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${
                copied ? "bg-[#22c55e] text-slate-900 shadow-lg shadow-green-500/20" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {copied ? "✅ تم نسخ الكود بنجاح" : "📋 نسخ الكود الآن"}
            </button>
          </div>

          {/* خطوات إضافة الكود داخل اللعبة */}
          <div className="text-right mb-10 space-y-4">
            <h3 className="text-[#22c55e] font-black text-sm uppercase italic border-r-4 border-[#22c55e] pr-3 mr-1">كيف تضيف الكود في موقع الفانتزي؟</h3>
            <div className="bg-slate-900/40 rounded-3xl p-6 space-y-4 text-sm text-gray-400 font-medium">
                <div className="flex gap-3">
                    <span className="bg-[#22c55e] text-slate-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                    <p>افتح موقع الفانتزي واضغط على <span className="text-white font-bold italic">"Leagues & Cup"</span></p>
                </div>
                <div className="flex gap-3">
                    <span className="bg-[#22c55e] text-slate-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                    <p>اضغط على <span className="text-white font-bold italic">"Join a league and cup"</span> ثم اختر <span className="text-white font-bold italic">"Join a private league"</span></p>
                </div>
                <div className="flex gap-3">
                    <span className="bg-[#22c55e] text-slate-950 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                    <p>ضع الكود المنسوخ بالأعلى في الخانة واضغط <span className="text-[#22c55e] font-bold">"Join League"</span></p>
                </div>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-950/20 border-2 border-red-800/30 rounded-[25px] text-red-400 text-sm font-bold flex items-center justify-center gap-3 animate-bounce">
               <span>❌ {error}</span>
            </div>
          )}

          <div className="grid gap-4">
            <a
              href="https://fantasy.premierleague.com/leagues/join/private"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-2xl transition-all shadow-lg border border-slate-600 italic uppercase text-sm"
            >
              الذهاب لموقع الفانتزي الآن ↗
            </a>

            <button
              onClick={handleVerify}
              disabled={loading}
              className={`w-full py-6 rounded-[25px] font-black text-xl transition-all transform active:scale-95 shadow-2xl ${
                loading
                  ? "bg-slate-700 opacity-50 cursor-not-allowed"
                  : "bg-[#22c55e] text-slate-900 hover:bg-[#1da850] hover:shadow-green-500/20"
              }`}
            >
              {loading ? "جاري التأكد من وجودك..." : "تم الانضمام، ابدأ الآن ⚡"}
            </button>
          </div>

          {/* قسم الدعم الفني */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-[#22c55e] text-xs font-black uppercase mb-4 tracking-[0.2em] italic">تواجه صعوبة في التسجيل؟</p>
            
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-center gap-4 text-xs font-bold italic">
                    <a href="mailto:fplrush.official@gmail.com" className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 hover:text-[#22c55e] transition-colors">
                        📧 fplrush.official@gmail.com
                    </a>
                    <a href="https://facebook.com/yourpage" target="_blank" className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 hover:text-blue-400 transition-colors">
                        🔵 صفحة الفيسبوك الرسمية
                    </a>
                </div>
                
                <p className="text-gray-200 font-black text-sm bg-slate-900/80 py-4 rounded-2xl border border-slate-700/50 px-6 animate-pulse">
                    🚀 سيتم الرد عليك وحل مشكلتك في أسرع وقت ممكن.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLeaguePage;