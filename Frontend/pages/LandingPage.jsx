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

        {/* 🎉 Season 1 Celebration Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-2xl bg-slate-900/40 backdrop-blur-md border border-yellow-500/20 rounded-3xl p-5 md:p-6 mb-8 shadow-[0_0_30px_rgba(234,179,8,0.05)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-1">
              حصاد الموسم الأول
            </span>
            <h2 className="text-lg md:text-2xl font-black text-white leading-snug">
              انتهى الموسم الأول من FPL Rush بنجاح! +200 مدرب شاركونا المنافسة 🏆
            </h2>
            <p className="text-gray-400 text-xs md:text-sm font-semibold leading-relaxed mt-2 max-w-xl">
              شكرا لكل من ساهم وشارك في نجاح هذه التجربة الاستثنائية.
            </p>
          </div>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 mt-8">

          {user ? (
            <Link
              to="/dashboard"
              className="bg-[#22c55e] hover:bg-green-600 text-slate-900 font-bold text-lg px-10 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              الذهاب إلى لوحة التحكم
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-[#22c55e] hover:bg-green-600 text-slate-900 font-bold text-lg px-10 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              ابدأ الآن — سجّل أو انضم
            </Link>
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
