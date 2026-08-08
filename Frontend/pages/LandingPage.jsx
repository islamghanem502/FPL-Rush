import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { COPY } from "../constants";
import { useAuth } from "../store/AuthContext";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter italic">
            <span className="text-white">FPL</span>
            <span className="text-[#22c55e]"> RUSH</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-semibold mb-2">
            {COPY.LANDING.heroSubtitle}
          </p>
          <div className="bg-[#22c55e] text-slate-900 font-bold px-4 py-1 rounded-full inline-block transform -rotate-2">
            {COPY.LANDING.heroTagline}
          </div>
        </motion.div>



        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full max-w-md">

          {user ? (
            <Link
              to="/dashboard"
              className="w-full bg-[#22c55e] hover:bg-green-600 text-slate-900 font-black text-lg px-8 py-4 rounded-2xl shadow-xl transition-all transform hover:scale-105"
            >
              الذهاب إلى لوحة التحكم ⚽
            </Link>
          ) : (
            <>
              {/* Button 1: Register */}
              <Link
                to="/register"
                className="flex-1 bg-[#22c55e] hover:bg-[#1da850] text-slate-950 font-black text-lg px-8 py-4 rounded-2xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>انضم الآن 🚀</span>
              </Link>

              {/* Button 2: Login */}
              <Link
                to="/login"
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-lg px-8 py-4 rounded-2xl border border-slate-600/80 hover:border-[#22c55e]/50 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول ⚡</span>
              </Link>
            </>
          )}
        </div>

        <Link
          to="/partnership"
          className="mt-12 text-[#22c55e] font-bold border-b-2 border-[#22c55e] pb-1 hover:text-white hover:border-white transition-all"
        >
          {COPY.LANDING.ctaPartnership}
        </Link>

        {/* ── Live Bonus Tracker CTA ── */}
        <Link
          to="/bonus"
          className="mt-6 group flex items-center gap-3 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/50 hover:border-[#22c55e]/60 text-white font-bold text-base px-7 py-3.5 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span>تابع بونص اللاعبين</span>
          <span className="text-[#22c55e] text-sm font-semibold group-hover:translate-x-1 transition-transform">Live →</span>
        </Link>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {[
            {
              title: "منافسة عادلة",
              desc: "تحديات مبنية على المهارة فقط بدون أي اشتراكات.",
            },
            {
              title: "جوائز مختلفة",
              desc: "جوائز مادية فورية وجوائز قيمة كل جولة.",
            },
            {
              title: "إحصائيات دقيقة",
              desc: "تابع ترتيبك ونقاطك لحظة بلحظة مع تحديثات مباشرة.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50"
            >
              <h3 className="text-xl font-bold mb-2 text-[#22c55e]">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LandingPage;
