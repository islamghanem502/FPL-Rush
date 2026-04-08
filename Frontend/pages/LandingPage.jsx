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
