import React, { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const VerifyLeaguePage = () => {
  const { user, updateUserInfo } = useAuth();

  // If the user is already verified but somehow ended up here (e.g. they don't have contact info), 
  // skip directly to PROFILE step. Otherwise start at VERIFY.
  const [step, setStep] = useState(user?.isVerified ? "PROFILE" : "VERIFY");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const navigate = useNavigate();

  const LEAGUE_CODE = "jv1xxz";
  const WHATSAPP_URL = "https://wa.me/201094474067";

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

        // If user already has contact info, redirect to dashboard.
        // Otherwise, move to the PROFILE step to ask for it.
        if (user?.email || user?.phone || response.data.user?.email || response.data.user?.phone) {
          navigate("/dashboard");
        } else {
          setStep("PROFILE");
        }
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

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setError("");

    // If they skip or leave empty
    if (!email && !phone) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("صيغة البريد الإلكتروني غير صحيحة");
        setLoading(false);
        return;
      }
      await api.post("/auth/save-contact", {
        email: email || undefined,
        phone: phone || undefined
      });
      updateUserInfo({ email, phone });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "فشل حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4 leading-relaxed">
      <div className="max-w-lg w-full bg-slate-800 border-2 border-slate-700 rounded-[45px] p-8 md:p-12 shadow-2xl relative overflow-hidden">

        <div className="text-center relative z-10">
          <h1 className="text-4xl font-black mb-6 italic tracking-tighter uppercase">
            {step === "VERIFY" ? (
              <>توثيق <span className="text-[#22c55e]">الحساب</span></>
            ) : (
              <>أضف <span className="text-[#22c55e]">بياناتك</span></>
            )}
          </h1>

          {step === "VERIFY" && (
            <>
              {/* شرح الإجراء */}
              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-3xl p-6 mb-8 shadow-inner">
                <p className="text-gray-200 text-base font-bold leading-relaxed tracking-tight">
                  ⚠️ هذا الإجراء ضروري لربط حسابك ببيانات الفانتزي الرسمية، والتأكد من هويتك كمدرب حقيقي لضمان <span className="text-[#22c55e]">عدالة المنافسة وتوزيع الجوائز</span>.
                </p>
              </div>

              {/* إضافة لينك الفيديو التوضيحي هنا (أزرق وثابت) */}
              <div className="flex justify-center mb-4">
                <a
                  href="https://youtu.be/9CaqW4Sm6Gs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-xs font-black bg-blue-950/30 px-5 py-2.5 rounded-full border border-blue-900/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                  <span>مشاهدة كيفية اتمام تلك الخطوة</span>
                </a>
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
                  className={`w-full py-3 rounded-xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${copied ? "bg-[#22c55e] text-slate-900 shadow-lg shadow-green-500/20" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
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

                <div className="text-center mt-6 mb-2">
                  <p className="text-xs text-gray-500 mb-3 font-bold">في حال واجهتك اي مشكلة</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-green-800/30 border border-green-700/40
                               text-green-400 hover:text-green-300 hover:bg-green-800/50
                               text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    تواصل معنا عبر واتساب
                  </a>
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
                  className={`w-full py-6 rounded-[25px] font-black text-xl transition-all transform active:scale-95 shadow-2xl ${loading
                      ? "bg-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-[#22c55e] text-slate-900 hover:bg-[#1da850] hover:shadow-green-500/20"
                    }`}
                >
                  {loading ? "جاري التأكد من وجودك..." : "تم الانضمام، ابدأ الآن ⚡"}
                </button>
              </div>
            </>
          )}

          {step === "PROFILE" && (
            <form onSubmit={handleSaveContact} className="space-y-6 text-right" autoComplete="on">
              <div className="text-center space-y-2 mb-8">
                <p className="text-sm text-gray-400 font-bold bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 leading-relaxed">
                  نطلب وسيلة تواصل لإرسال الجوائز وتسليمها لك في حال فوزك في التحديات. 🎁
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-950/20 border-2 border-red-800/30 rounded-2xl text-red-400 text-sm font-bold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    dir="ltr"
                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl px-5 py-4
                               text-white text-base outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl px-5 py-4
                               text-white text-base outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || (!email && !phone)}
                  className="flex-1 bg-[#22c55e] text-slate-900 font-black py-5 rounded-2xl shadow-lg shadow-green-500/20
                             hover:bg-[#1da850] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? "جاري الحفظ..." : "حفظ وانطلاق 🚀"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                  className="flex-1 bg-slate-700 text-white font-bold py-5 rounded-2xl hover:bg-slate-600 transition-colors border border-slate-600"
                >
                  تجاوز (Skip)
                </button>
              </div>
            </form>
          )}

          {/* قسم الدعم الفني */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-[#22c55e] text-xs font-black uppercase mb-4 tracking-[0.2em] italic">تواجه صعوبة؟</p>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-center gap-4 text-xs font-bold italic flex-wrap">
                <a href="mailto:fplrush.official@gmail.com" className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 hover:text-[#22c55e] transition-colors">
                  📧 fplrush.official@gmail.com
                </a>
                <a href="https://www.facebook.com/profile.php?id=61584963545932" target="_blank" rel="noreferrer" className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 hover:text-blue-400 transition-colors">
                  🔵 صفحة الفيسبوك الرسمية
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLeaguePage;