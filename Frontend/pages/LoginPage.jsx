import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../store/AuthContext";
import { authAPI } from "../services/api";

const LoginPage = () => {
  // ===== Login States =====
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

  // ===== Forgot Password States =====
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [showForgot, setShowForgot] = useState(false);
  const [attempts, setAttempts] = useState(3);

  // ===== UI States =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!loginEmail || !loginPassword) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      setLoading(false);
      return;
    }

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      if (result.isAdmin) {
        navigate("/admin");
      } else if (!result.isVerified) {
        navigate("/verify");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleSendOtp = async () => {
    if (!forgotEmail) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authAPI.forgotPassword(forgotEmail);
      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "فشل إرسال الرمز");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("أدخل رمز التحقق");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authAPI.verifyOTP(forgotEmail, otp);
      setStep(3);
      setSuccess("تم التحقق بنجاح");
    } catch (err) {
      setAttempts((prev) => prev - 1);
      if (attempts - 1 <= 0) {
        setError("تم استهلاك جميع المحاولات. أعد المحاولة من البداية.");
        setTimeout(() => resetForgotFlow(), 2000);
      } else {
        setError("رمز التحقق غير صحيح");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("يرجى إدخال كلمة المرور الجديدة");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authAPI.resetPassword(forgotEmail, otp, newPassword);
      setSuccess("تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.");
      setTimeout(() => resetForgotFlow(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setShowForgot(false);
    setStep(1);
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setAttempts(3);
    setError("");
    setSuccess("");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-900 text-white">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 w-full max-w-lg shadow-2xl transition-all">
          <div className="text-center mb-10">
            <Link to="/" className="text-4xl font-black italic block mb-6 hover:opacity-80 transition-opacity">
              FPL <span className="text-[#22c55e]">RUSH</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-100">تسجيل الدخول</h2>
          </div>

          {error && !showForgot && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {success && !showForgot && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-xl text-green-300 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#22c55e] transition-all"
              placeholder="البريد الإلكتروني"
              required
            />


            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#22c55e] transition-all"
                placeholder="كلمة المرور"
                required
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-gray-400 hover:text-[#22c55e] transition-colors"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] text-slate-900 font-bold py-5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "جاري التحميل..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700 text-center font-bold text-sm">
            <p className="text-gray-400">
              ليس لديك حساب؟{" "}
              <Link to="/register" className="text-[#22c55e] hover:underline">
                انشئ حساب جديد
              </Link>
            </p>
          </div>
        </div>
      </div>


      {showForgot && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl p-8 border border-slate-700 shadow-2xl relative">
            <button
              onClick={resetForgotFlow}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-6 text-center">
              استعادة كلمة المرور
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-xl text-green-300 text-sm text-center">
                {success}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-slate-900 font-bold py-3 rounded-xl hover:bg-[#1da850]"
                >
                  {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="أدخل رمز التحقق"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-slate-900 font-bold py-3 rounded-xl hover:bg-[#1da850]"
                >
                  {loading ? "جاري التحقق..." : "تحقق"}
                </button>
                <p className="text-sm text-gray-400 text-center font-bold">
                  المحاولات المتبقية: {attempts}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تأكيد كلمة المرور"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#22c55e]"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full bg-[#22c55e] text-slate-900 font-bold py-3 rounded-xl hover:bg-[#1da850]"
                >
                  {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LoginPage;