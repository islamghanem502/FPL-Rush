import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../store/AuthContext";
import { authAPI } from "../services/api";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [fplId, setFplId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.register({
        teamId: Number(fplId),
        email,
        password,
      });

      if (response.data && response.data.token) {
        const result = await login(response.data);

        if (result.success) {
          navigate("/verify");
        } else {
          setError("تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول يدوياً");
          navigate("/login");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "فشل إنشاء الحساب، تأكد من البيانات وحاول مرة أخرى"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-900 text-white leading-relaxed">
        
        {/* صندوق التسجيل */}
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 w-full max-w-lg shadow-2xl transition-all mb-10">
          <div className="text-center mb-10">
            <Link
              to="/"
              className="text-4xl font-black italic block mb-6 hover:opacity-80 transition-opacity"
            >
              FPL <span className="text-[#22c55e]">RUSH</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-100 italic">
              انضم لعالم المهارة
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm text-center animate-pulse font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  معرف فريقك (FPL ID)
                </label>
                
                {/* لينك الشرح باللون الأزرق وثابت بدون أنميشن */}
                <a 
                  href="https://youtu.be/UO_Hwt9v-TI" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-[11px] font-bold bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-900/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                  <span>شاهد طريقة الحصول عليه</span>
                </a>
              </div>
              
              <input
                type="number"
                value={fplId}
                onChange={(e) => setFplId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-bold"
                placeholder="مثلاً: 123456"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                البريد الإلكتروني
              </label>
              <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                يرجى إدخال بريد إلكتروني صالح للتواصل معك في حال الفوز أو الحصول على مركز متقدم.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-bold"
                placeholder="name@example.com"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-[#22c55e] border-transparent outline-none transition-all placeholder-slate-600 font-bold"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] hover:bg-[#1da850] text-slate-900 font-black py-5 rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase italic"
            >
              {loading ? "جاري التجهيز..." : "إنشاء حساب جديد"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400 font-bold">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-[#22c55e] hover:underline transition-all">
              تسجيل دخول
            </Link>
          </div>
        </div>

        <div className="w-full max-w-lg space-y-6">
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-right shadow-inner">
            <h3 className="text-[#22c55e] font-black text-sm mb-4 flex items-center justify-end gap-2 italic">
               كيف تجد الـ ID الخاص بك؟ 🆔
            </h3>
            <div className="text-gray-400 text-xs leading-relaxed space-y-2">
              <p>1. افتح موقع الفانتزي من المتصفح (Chrome/Safari).</p>
              <p>2. ادخل على صفحة <span className="text-white font-bold italic underline">Points</span>.</p>
              <p>3. ستجد الـ ID في رابط الصفحة، مثال:</p>
              <p className="bg-slate-900/80 p-3 rounded-lg font-mono text-center tracking-tighter text-[10px] md:text-xs border border-slate-700">
                fantasy.premierleague.com/entry/<span className="text-[#22c55e] font-black text-sm">123456</span>/event/1
              </p>
            </div>
          </div>

          <div className="text-center space-y-4 pb-12">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">تحتاج لمساعدة؟</p>
            <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
              <a href="mailto:fplrush.official@gmail.com" className="text-xs bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-gray-300 hover:text-white transition-all w-full md:w-auto">
                📧 fplrush.official@gmail.com
              </a>
              <a href="https://www.facebook.com/profile.php?id=61584963545932" target="_blank" rel="noreferrer" className="text-xs bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-blue-400 font-bold hover:bg-slate-700 transition-all w-full md:w-auto">
                🔵 صفحة الفيسبوك
              </a>
            </div>
            <p className="text-gray-300 text-sm font-bold bg-slate-800/20 py-3 rounded-xl border border-slate-700/30 italic">
               سيتم الرد عليك وحل مشكلتك في أسرع وقت ممكن.
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;