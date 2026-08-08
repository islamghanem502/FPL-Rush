import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Layout from "../components/Layout";
import { useAuth } from "../store/AuthContext";
import { authAPI } from "../services/api";

const WHATSAPP_URL = "https://wa.me/201094474067";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password flow (3 steps):
  // Step 1: Request Code
  // Step 2: Verify Code (validate 6-digit OTP code FIRST)
  // Step 3: Set New Password (only shown IF code is verified)
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const navigateAfterAuth = (res) => {
    if (!res.success) { setError(res.error); return; }
    if (res.isAdmin) return navigate("/admin");
    if (!res.isVerified) return navigate("/register");
    navigate("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    navigateAfterAuth(res);
  };

  // Step 1: Request 6-digit OTP code to email
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");
    if (!email) {
      setError("أدخل بريدك الإلكتروني لإرسال كود التحقق");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      setForgotSuccess(res.data.message || "تم إرسال كود التحقق المكون من 6 أرقام إلى بريدك الإلكتروني");
      setForgotStep(2); // Move to Step 2: Code Verification
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء إرسال البريد");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the code FIRST
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");

    if (!resetCode || resetCode.length !== 6) {
      setError("يرجى إدخال الكود المكون من 6 أرقام كاملاً");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyResetCode(email, resetCode.trim());
      setForgotSuccess(res.data.message || "تم التحقق من الكود بنجاح! أدخل كلمة المرور الجديدة");
      setForgotStep(3); // Code verified! Move to Step 3: New Password
    } catch (err) {
      setError(err.response?.data?.message || "كود التحقق غير صحيح أو منتهي الصلاحية");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit new password (after code verified)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("يرجى إدخال كلمة المرور الجديدة وتأكيدها");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(email, resetCode.trim(), newPassword);
      setForgotSuccess(res.data.message || "تم تغيير كلمة المرور بنجاح! يمكنك الدخول الآن");
      setTimeout(() => {
        resetForgotState();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotState = () => {
    setForgotMode(false);
    setForgotStep(1);
    setError("");
    setForgotSuccess("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Layout>
      <div className="flex justify-center px-4 pt-12 md:pt-10 pb-12 bg-slate-900 text-white min-h-screen items-start">
        <div className="w-full max-w-md">

          {/* ── Title ── */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">
              {forgotMode
                ? (forgotStep === 1
                    ? "إعادة تعيين كلمة المرور 🔑"
                    : forgotStep === 2
                    ? "تأكيد كود التحقق 🔢"
                    : "كلمة المرور الجديدة 🔐")
                : "تسجيل الدخول ⚡"}
            </h1>
            <p className="text-gray-400 text-sm font-bold">
              {forgotMode
                ? (forgotStep === 1
                    ? "أدخل بريدك الإلكتروني لاستلام كود التحقق"
                    : forgotStep === 2
                    ? "أدخل الكود المكون من 6 أرقام للتأكد منه"
                    : "تم التأكد من الكود بنجاح، اختر كلمة مرور جديدة")
                : "أهلاً بك مجدداً في FPL Rush"}
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-slate-800 rounded-3xl border border-slate-700/80 shadow-2xl p-8">

            {error && (
              <div className="mb-5 p-3 rounded-xl text-sm text-center font-bold bg-red-900/40 border border-red-700/60 text-red-300">
                {error}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-5 p-3 rounded-xl text-sm text-center font-bold bg-green-900/40 border border-green-700/60 text-green-300">
                {forgotSuccess}
              </div>
            )}

            {!forgotMode ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 text-right">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    disabled={loading}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5
                               text-white font-medium text-base outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 dir-ltr text-right"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setForgotStep(1); setError(""); setForgotSuccess(""); }}
                      className="text-xs text-[#22c55e] hover:underline font-bold"
                    >
                      نسيت كلمة المرور؟
                    </button>
                    <label className="block text-sm font-bold text-gray-300">
                      كلمة المرور
                    </label>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5
                               text-white font-medium text-base outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 dir-ltr text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed text-base mt-2"
                >
                  {loading ? "جاري الدخول..." : "تسجيل الدخول 🚀"}
                </button>
              </form>
            ) : forgotStep === 1 ? (
              /* FORGOT STEP 1: Request OTP Code */
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 text-right">
                    البريد الإلكتروني المسجّل
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    disabled={loading}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5
                               text-white font-medium text-base outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 dir-ltr text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  {loading ? "جاري الإرسال..." : "إرسال كود التحقق 📩"}
                </button>

                <button
                  type="button"
                  onClick={resetForgotState}
                  className="w-full text-center text-xs text-gray-400 hover:text-white font-bold transition-colors pt-2"
                >
                  ← العودة لتسجيل الدخول
                </button>
              </form>
            ) : forgotStep === 2 ? (
              /* FORGOT STEP 2: Input & Validate 6-digit Code FIRST */
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 text-right">
                    أدخل كود التحقق المكون من 6 أرقام
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    disabled={loading}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-4
                               text-[#22c55e] font-black text-2xl tracking-[8px] outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 text-center font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || resetCode.length !== 6}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed text-base"
                >
                  {loading ? "جاري التحقق..." : "تأكيد الكود ومتابعة ←"}
                </button>

                <div className="flex justify-between items-center pt-2 text-xs font-bold text-gray-400">
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setError(""); setForgotSuccess(""); }}
                    className="hover:text-[#22c55e] transition-colors"
                  >
                    إعادة طلب كود جديد 🔄
                  </button>
                  <button
                    type="button"
                    onClick={resetForgotState}
                    className="hover:text-white transition-colors"
                  >
                    إلغاء ←
                  </button>
                </div>
              </form>
            ) : (
              /* FORGOT STEP 3: Set New Password (Only after code is verified) */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-slate-900/60 border border-green-700/50 p-3.5 rounded-xl text-center text-xs text-green-400 font-bold mb-2">
                  ✅ الكود صحيح! أدخل كلمة المرور الجديدة الآن
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1.5 text-right">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5
                               text-white font-medium text-base outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1.5 text-right">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5
                               text-white font-medium text-base outline-none focus:border-[#22c55e]
                               focus:ring-2 focus:ring-[#22c55e]/20 transition-all placeholder-slate-600 dir-ltr text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-2xl shadow-lg
                             hover:bg-[#1da850] hover:scale-[1.01] active:scale-[0.98] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed text-base mt-2"
                >
                  {loading ? "جاري التغيير..." : "حفظ كلمة المرور الجديدة 🔑"}
                </button>
              </form>
            )}

            {/* Google Sign-In */}
            {!forgotMode && (
              <div className="mt-6 pt-6 border-t border-slate-700/60">
                <p className="text-center text-xs text-gray-500 font-bold mb-4">أو تابع بـ</p>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      setError("");
                      const res = await googleLogin(credentialResponse.credential);
                      navigateAfterAuth(res);
                    }}
                    onError={() => setError("فشل تسجيل الدخول بواسطة Google، حاول مرة أخرى")}
                    width="350"
                    text="continue_with"
                    locale="ar"
                    shape="rectangular"
                    theme="filled_black"
                  />
                </div>
              </div>
            )}

            {!forgotMode && (
              <div className="mt-6 text-center text-xs text-gray-400">
                ليس لديك حساب؟{" "}
                <Link to="/register" className="text-[#22c55e] font-bold hover:underline">
                  إنشاء حساب جديد
                </Link>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500 mb-3 font-bold">في حال واجهتك أي مشكلة</p>
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
      </div>
    </Layout>
  );
};

export default LoginPage;