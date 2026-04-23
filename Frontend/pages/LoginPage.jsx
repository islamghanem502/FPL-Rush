import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../store/AuthContext";
import { authAPI } from "../services/api";

// ── 4-Box PIN Input ───────────────────────────────────────────────────────────
const PinInput = ({ value, onChange, disabled, autocomplete = "current-password" }) => {
  const inputs = useRef([]);

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const next = value.split("");
        next[idx] = "";
        onChange(next.join(""));
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
      }
    }
  };

  const handleChange = (e, idx) => {
    const digit = e.target.value.replace(/\D/, "").slice(-1);
    const next = (value + "    ").slice(0, 4).split("");
    next[idx] = digit;
    onChange(next.join("").trimEnd());
    if (digit && idx < 3) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 3)]?.focus();
    e.preventDefault();
  };

  // Auto-focus first box on mount
  useEffect(() => { inputs.current[0]?.focus(); }, []);

  return (
    <div className="flex gap-3 justify-center" dir="ltr">
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKey(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete={idx === 0 ? autocomplete : "off"}
          className="w-14 h-14 text-center text-2xl font-black bg-slate-900 border-2 border-slate-600 rounded-2xl
                     text-white focus:border-[#22c55e] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30
                     transition-all disabled:opacity-40 caret-transparent"
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const STEP = { ID: "id", SETUP: "setup", LOGIN_PIN: "login_pin" };
const WHATSAPP_URL = "https://wa.me/201094474067";

const LoginPage = () => {
  const [step, setStep] = useState(STEP.ID);
  const [fplId, setFplId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExistsInDb, setUserExistsInDb] = useState(false); // id موجود لكن بدون PIN


  const navigate = useNavigate();
  const { login, setupPin } = useAuth();
  const fplInputRef = useRef(null);

  useEffect(() => { fplInputRef.current?.focus(); }, []);

  const clearError = () => setError("");

  // ── Redirect after auth ───────────────────────────────────────────────────
  const redirect = (isAdmin, isVerified, newUser) => {
    if (isAdmin) return navigate("/admin");
    if (newUser || !isVerified) return navigate("/verify");
    navigate("/dashboard");
  };

  // ── Step 1: Check FPL ID ──────────────────────────────────────────────────
  const handleCheckId = async (e) => {
    e.preventDefault();
    clearError();
    const idNum = Number(fplId);
    if (!fplId || isNaN(idNum) || idNum <= 0) {
      setError("يرجى إدخال رقم FPL ID صحيح");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.checkId(idNum);
      const { is_migrated, exists } = res.data;
      setPin("");
      setUserExistsInDb(!!exists);
      if (is_migrated) {
        setStep(STEP.LOGIN_PIN);
      } else {
        // سواء كان مستخدم جديد كلياً أو موجود بدون PIN → نطلب منه الإعداد
        setStep(STEP.SETUP);
      }
    } catch (err) {
      setError(err.response?.data?.message || "تعذّر التحقق من الـ ID");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2A: Setup PIN (new user) ─────────────────────────────────────────
  const handleSetupPin = async (e) => {
    e.preventDefault();
    clearError();
    if (pin.length !== 4) { setError("أدخل 4 أرقام كاملة"); return; }
    setLoading(true);
    const result = await setupPin(Number(fplId), pin);
    setLoading(false);
    if (result.success) {
      const forcedNewUser = !userExistsInDb;
      if (!result.isVerified || !result.hasContact) {
        navigate("/verify");
      } else {
        redirect(result.isAdmin, result.isVerified, forcedNewUser);
      }
    } else {
      setError(result.error);
      setPin("");
    }
  };

  // ── Step 2B: Login with PIN (existing user) ───────────────────────────────
  const handleLoginPin = async (e) => {
    e.preventDefault();
    clearError();
    if (pin.length !== 4) { setError("أدخل رمز التحقق كاملاً"); return; }
    setLoading(true);
    const result = await login(Number(fplId), pin);
    setLoading(false);
    if (result.success) {
      if (!result.isVerified || !result.hasContact) {
        navigate("/verify");
      } else {
        redirect(result.isAdmin, result.isVerified, false);
      }
    } else {
      setError(result.error);
      setPin("");
    }
  };


  // ── Back to ID step ───────────────────────────────────────────────────────
  const goBack = () => { setStep(STEP.ID); clearError(); setPin(""); };

  // ── Error alert ───────────────────────────────────────────────────────────
  const Alert = ({ msg }) =>
    msg ? (
      <div className="mb-5 p-3 rounded-xl text-sm text-center font-bold
                      bg-red-900/40 border border-red-700/60 text-red-300 animate-pulse">
        {msg}
      </div>
    ) : null;

  // ── FPL ID badge (shown in steps 2A & 2B) ────────────────────────────────
  const IdBadge = () => (
    <div className="flex items-center justify-between bg-slate-900/70 border border-slate-700/60 rounded-xl px-4 py-3 mb-2">
      <span className="text-xs text-gray-400 font-bold">FPL ID</span>
      <div className="flex items-center gap-3">
        <span className="font-black text-white text-lg tracking-widest">{fplId}</span>
        <button
          type="button"
          onClick={goBack}
          className="text-[10px] text-gray-500 hover:text-[#22c55e] transition-colors border border-slate-600 hover:border-[#22c55e]/50 px-2 py-0.5 rounded-lg"
        >
          تغيير
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex justify-center px-4 pt-12 md:pt-10 pb-12 bg-slate-900 text-white min-h-screen items-start">
        <div className="w-full max-w-md">

          {/* ── Title ── */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm font-bold">انضم أو سجّل دخولك</p>
          </div>

          {/* ── Step dots ── */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[STEP.ID, STEP.SETUP].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${step === STEP.ID && i === 0 ? "bg-[#22c55e] scale-125" :
                    step !== STEP.ID && i === 1 ? "bg-[#22c55e] scale-125" :
                      i === 0 && step !== STEP.ID ? "bg-green-700" :
                        "bg-slate-600"}`}
                />
                {i === 0 && <div className={`w-16 h-0.5 rounded transition-all duration-500 ${step !== STEP.ID ? "bg-green-600" : "bg-slate-700"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ── Card ── */}
          <div className="bg-slate-800 rounded-3xl border border-slate-700/80 shadow-2xl p-8">

            <Alert msg={error} />

            {/* ════════ STEP 1: FPL ID ════════ */}
            {step === STEP.ID && (
              <form onSubmit={handleCheckId} className="space-y-5" autoComplete="on">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 text-right">
                    أدخل رقم الـ FPL ID الخاص بك
                  </label>
                  <input
                    ref={fplInputRef}
                    id="fpl-id-input"
                    type="number"
                    name="username"
                    autoComplete="username"
                    inputMode="numeric"
                    value={fplId}
                    onChange={(e) => setFplId(e.target.value)}
                    placeholder="مثلاً: 1234567"
                    disabled={loading}
                    className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl px-4 py-4
                               text-white font-bold text-xl outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 text-center
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* How to find FPL ID */}
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-xs text-gray-400 text-right leading-relaxed space-y-1">
                  <p className="text-gray-300 font-bold mb-2">📌 كيف أجد الـ ID؟</p>
                  <p>١. افتح <a href="https://fantasy.premierleague.com" target="_blank" rel="noreferrer" className="text-[#22c55e] hover:underline font-bold transition-all">fantasy.premierleague.com</a></p>
                  <p>٢. انتقل لصفحة <span className="text-white font-bold">Points</span></p>
                  <p>٣. الرقم في رابط الصفحة هو الـ ID</p>
                  <p className="font-mono text-center text-[10px] bg-slate-800 rounded-lg p-2 mt-2 border border-slate-700">
                    /entry/<span className="text-[#22c55e] font-black text-xs">123456</span>/event/1
                  </p>
                  <div className="pt-3 mt-2 border-t border-slate-700/50 flex justify-center">
                    <a 
                      href="https://youtu.be/9CaqW4Sm6Gs" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-xs font-bold bg-blue-950/40 px-4 py-2 rounded-full border border-blue-900/50 hover:bg-blue-900/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                      </svg>
                      <span>شاهد طريقة الحصول عليه والتسجيل</span>
                    </a>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !fplId}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  {loading ? "جاري التحقق..." : "متابعة ←"}
                </button>
              </form>
            )}

            {/* ════════ STEP 2B: Login — existing user ════════ */}
            {step === STEP.LOGIN_PIN && (
              <form onSubmit={handleLoginPin} className="space-y-6" autoComplete="on">
                <IdBadge />

                <div className="text-center">
                  <p className="text-base font-black text-gray-200">أدخل رمز التحقق</p>
                  <p className="text-xs text-gray-500 mt-1">الـ PIN المكوّن من 4 أرقام</p>
                </div>

                {/* hidden username field → browser keychain links PIN to fpl_id */}
                <input type="text" name="username" autoComplete="username" value={fplId} onChange={() => { }} className="sr-only" readOnly />

                <PinInput value={pin} onChange={setPin} disabled={loading} autocomplete="current-password" />

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "جاري الدخول..." : "دخول 🚀"}
                </button>

              </form>
            )}

            {/* ════════ STEP 2A: Setup PIN — new user ════════ */}
            {step === STEP.SETUP && (
              <form onSubmit={handleSetupPin} className="space-y-6" autoComplete="on">
                <IdBadge />

                <div className="text-center">
                  <p className="text-base font-black text-gray-200">حدد رمز PIN الخاص بك</p>
                  <p className="text-xs text-gray-500 mt-1">اختر 4 أرقام ستستخدمها في كل مرة</p>
                </div>

                {/* hidden username → password manager saves PIN under this fpl_id */}
                <input type="text" name="username" autoComplete="username" value={fplId} onChange={() => { }} className="sr-only" readOnly />

                <PinInput value={pin} onChange={setPin} disabled={loading} autocomplete="new-password" />

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "جاري الإنشاء..." : "إنشاء الحساب ✅"}
                </button>

                <p className="text-center text-xs text-gray-600">
                  لن يُطلب منك البريد الإلكتروني — الـ FPL ID + PIN كافيان 🔒
                </p>
              </form>
            )}



          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500 mb-3 font-bold">في حال واجهتك اي مشكلة</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-800/30 border border-green-700/40
                         text-green-400 hover:text-green-300 hover:bg-green-800/50
                         text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              {/* WhatsApp icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              تواصل معنا عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;