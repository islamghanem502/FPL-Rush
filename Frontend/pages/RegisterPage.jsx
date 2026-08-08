import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Layout from "../components/Layout";
import { useAuth } from "../store/AuthContext";
import api from "../services/api";

const RegisterPage = () => {
  const { user, register, linkFpl, googleLogin, updateUserInfo, logout } = useAuth();
  const navigate = useNavigate();

  // Determine starting step based on existing user session state
  const getInitialStep = () => {
    if (!user) return 1; // Step 1: Register Account
    if (!user.fpl_id || user.accountStatus !== "fpl_linked") return 2; // Step 2: Link FPL ID
    if (!user.isVerified) return 3; // Step 3: Verify League
    return 3;
  };

  const [step, setStep] = useState(getInitialStep());

  // Redirect if user is already fully verified
  useEffect(() => {
    if (user?.isVerified) {
      navigate("/dashboard", { replace: true });
    } else if (user) {
      if (!user.fpl_id || user.accountStatus !== "fpl_linked") {
        setStep(2);
      } else if (!user.isVerified) {
        setStep(3);
      }
    }
  }, [user, navigate]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fplIdInput, setFplIdInput] = useState(user?.fpl_id || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const LEAGUE_CODE = "v8hg1z";
  const WHATSAPP_URL = "https://wa.me/201094474067";

  const handleCopy = () => {
    navigator.clipboard.writeText(LEAGUE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step 1 Handler: Register Account ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await register(email, password);
      if (res.success) {
        setStep(2);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 Handler: Link FPL ID ──
  const handleLinkFpl = async (e) => {
    e.preventDefault();
    setError("");
    const idNum = Number(fplIdInput);
    if (!fplIdInput || isNaN(idNum) || idNum <= 0) {
      setError("يرجى إدخال رقم FPL ID صحيح");
      return;
    }

    setLoading(true);
    try {
      const res = await linkFpl(idNum);
      if (res.success) {
        setStep(3);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ الـ ID");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 Handler: Verify League ──
  const handleVerifyLeague = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-league");
      if (response.data.success) {
        updateUserInfo({
          isVerified: true,
          teamName: response.data.user?.teamName || user?.teamName,
          managerName: response.data.user?.managerName || user?.managerName,
          totalPoints: response.data.user?.totalPoints || user?.totalPoints,
          overallRank: response.data.user?.overallRank || user?.overallRank,
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "لم نجد فريقك في الدوري، تأكد من الانضمام للكود الصحيح في الفانتزي ثم اضغط تحقق.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-900 text-white leading-relaxed">
        
        {/* Main Box */}
        <div className="bg-slate-800 p-8 md:p-10 rounded-[35px] border border-slate-700/80 w-full max-w-lg shadow-2xl transition-all relative overflow-hidden">

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link
              to="/"
              className="text-4xl font-black italic block mb-2 hover:opacity-80 transition-opacity tracking-tighter"
            >
              FPL <span className="text-[#22c55e]">RUSH</span>
            </Link>

            <h2 className="text-xl font-bold text-gray-200">
              {step === 1 && "إنشاء حساب جديد 🚀"}
              {step === 2 && "ربط حساب FPL ID ⚽"}
              {step === 3 && "توثيق العضوية بالدوري ⚡"}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              أكمل الخطوات الـ 3 لفتح الداشبورد والمشاركة في التحديات
            </p>
          </div>

          {/* ================= Stepper Header (Numbered 1 -> 2 -> 3) ================= */}
          <div className="flex items-center justify-center gap-2 mb-8 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
            {/* Step 1 Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                step === 1
                  ? "bg-[#22c55e] text-slate-950 shadow-md shadow-green-500/20"
                  : step > 1
                  ? "bg-green-950/60 text-green-400 border border-green-800/50"
                  : "bg-slate-800 text-gray-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {step > 1 ? "✓" : "1"}
              </span>
              <span>الحساب</span>
            </div>

            <span className="text-gray-600 font-bold text-xs">←</span>

            {/* Step 2 Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                step === 2
                  ? "bg-[#22c55e] text-slate-950 shadow-md shadow-green-500/20"
                  : step > 2
                  ? "bg-green-950/60 text-green-400 border border-green-800/50"
                  : "bg-slate-800 text-gray-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {step > 2 ? "✓" : "2"}
              </span>
              <span>FPL ID</span>
            </div>

            <span className="text-gray-600 font-bold text-xs">←</span>

            {/* Step 3 Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                step === 3
                  ? "bg-[#22c55e] text-slate-950 shadow-md shadow-green-500/20"
                  : "bg-slate-800 text-gray-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                3
              </span>
              <span>التوثيق</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-800/60 rounded-2xl text-red-300 text-sm text-center font-bold">
              ❌ {error}
            </div>
          )}

          {/* ════════ STEP 1: Email & Password ════════ */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5 text-right">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-medium dir-ltr text-right"
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5 text-right">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-medium dir-ltr text-right"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5 text-right">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-medium dir-ltr text-right"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#22c55e] hover:bg-[#1da850] text-slate-900 font-black py-4 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed mt-3"
              >
                {loading ? "جاري الإنشاء..." : "التالي: ربط FPL ID ←"}
              </button>

              <div className="mt-6 text-center text-xs text-gray-400 font-bold border-t border-slate-700/60 pt-4">
                لديك حساب بالفعل؟{" "}
                <Link to="/login" className="text-[#22c55e] hover:underline transition-all">
                  تسجيل دخول
                </Link>
              </div>

              {/* Google Sign-In */}
              <div className="pt-2">
                <p className="text-center text-xs text-gray-500 font-bold mb-3">أو انضم عبر</p>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      setError("");
                      const res = await googleLogin(credentialResponse.credential);
                      if (!res.success) { setError(res.error); return; }
                      // Google user will skip to their pending step automatically via useEffect
                    }}
                    onError={() => setError("فشل التسجيل بواسطة Google، حاول مرة أخرى")}
                    width="350"
                    text="signup_with"
                    locale="ar"
                    shape="rectangular"
                    theme="filled_black"
                  />
                </div>
              </div>
            </form>
          )}

          {/* ════════ STEP 2: Link FPL ID ════════ */}
          {step === 2 && (
            <form onSubmit={handleLinkFpl} className="space-y-5 text-right">
              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-2xl p-4 shadow-inner">
                <p className="text-gray-200 text-xs font-bold leading-relaxed text-center">
                  ⚠️ أدخل رقم FPL ID الخاص بك للربط التلقائي.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  رقم الـ FPL ID الخاص بك
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={fplIdInput}
                  onChange={(e) => setFplIdInput(e.target.value)}
                  placeholder="مثلاً: 1234567"
                  disabled={loading}
                  required
                  className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl px-5 py-4
                             text-white text-xl font-bold text-center outline-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/30 transition-all
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* How to find FPL ID */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 text-xs text-gray-400 text-right leading-relaxed space-y-1">
                <p className="text-gray-300 font-bold mb-2">📌 كيف تجد الـ ID بسرعة؟</p>
                <p>١. افتح موقع الفانتزي: <a href="https://fantasy.premierleague.com" target="_blank" rel="noreferrer" className="text-[#22c55e] hover:underline font-bold transition-all">fantasy.premierleague.com ↗</a></p>
                <p>٢. اذهب لتبويب <span className="text-white font-bold">Points</span></p>
                <p>٣. الرقم في رابط الصفحة هو الـ ID الخاص بك</p>
                <p className="font-mono text-center text-[10px] bg-slate-800 rounded-lg p-2 mt-2 border border-slate-700">
                  /entry/<span className="text-[#22c55e] font-black text-xs">123456</span>/event/1
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !fplIdInput}
                className="w-full py-4 bg-[#22c55e] text-slate-900 font-black text-base rounded-2xl transition-all shadow-lg hover:bg-[#1da850] disabled:opacity-40"
              >
                {loading ? "جاري الحفظ..." : "التالي: توثيق الدوري ←"}
              </button>
            </form>
          )}

          {/* ════════ STEP 3: Verify League Membership ════════ */}
          {step === 3 && (
            <div className="space-y-5 text-right">

              {/* User summary badge with Edit FPL ID option */}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold">رقم الـ FPL ID المرتبط</p>
                  <p className="text-base font-black text-[#22c55e] font-mono">#{user?.fpl_id || fplIdInput}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(2); setError(""); }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
                >
                  تعديل ✏️
                </button>
              </div>

              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-2xl p-4 shadow-inner">
                <p className="text-gray-200 text-xs font-bold leading-relaxed text-center">
                  ⚠️ انضم لدوري الفانتزي الخاص بنا لتأكيد هويتك وتفعيل حسابك بالكامل.
                </p>
              </div>

              {/* Code Box */}
              <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 relative group transition-all hover:border-[#22c55e]/50 text-center">
                <span className="text-[10px] text-gray-500 block mb-1 uppercase font-black tracking-widest">
                  كود الدوري الرسمي
                </span>
                <code className="text-3xl md:text-4xl font-mono font-black text-[#22c55e] block mb-3 tracking-widest">
                  {LEAGUE_CODE}
                </code>
                <button
                  onClick={handleCopy}
                  className={`w-full py-2.5 rounded-xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 ${
                    copied ? "bg-[#22c55e] text-slate-900 shadow-lg" : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  {copied ? "✅ تم نسخ الكود بنجاح" : "📋 نسخ الكود الآن"}
                </button>
              </div>

              {/* Steps */}
              <div className="bg-slate-900/40 rounded-2xl p-4 space-y-2 text-xs text-gray-400 font-medium">
                <p className="text-[#22c55e] font-black text-xs mb-2">كيف تضيف الكود في الفانتزي؟</p>
                <div className="flex gap-2.5 items-center">
                  <span className="bg-[#22c55e] text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <p>افتح موقع الفانتزي ➔ <span className="text-white font-bold">Leagues & Cup</span></p>
                </div>
                <div className="flex gap-2.5 items-center">
                  <span className="bg-[#22c55e] text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <p>اختر ➔ <span className="text-white font-bold">Join a private league</span></p>
                </div>
                <div className="flex gap-2.5 items-center">
                  <span className="bg-[#22c55e] text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                  <p>أدخل الكود بالأعلى واضغط ➔ <span className="text-[#22c55e] font-bold">Join League</span></p>
                </div>
              </div>

              <div className="grid gap-2.5">
                <a
                  href="https://fantasy.premierleague.com/leagues/join/private"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-2xl transition-all shadow-md border border-slate-600 italic uppercase text-xs text-center"
                >
                  الذهاب لموقع الفانتزي الآن ↗
                </a>

                <button
                  onClick={handleVerifyLeague}
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-xl ${
                    loading
                      ? "bg-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-[#22c55e] text-slate-900 hover:bg-[#1da850]"
                  }`}
                >
                  {loading ? "جاري التحقق من التوثيق..." : "تم الانضمام، تحقق وتفعيل الحساب ⚡"}
                </button>
              </div>
            </div>
          )}

          {/* Footer controls (Support) */}
          {user && (
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end items-center text-xs">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="text-green-400 hover:underline font-bold"
              >
                الدعم عبر واتساب 💬
              </a>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;