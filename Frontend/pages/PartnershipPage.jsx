import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ShieldCheck, Zap, Globe, Trophy, Users } from "lucide-react";
import Layout from "../components/Layout";
import { COPY } from "../constants";

const PartnershipPage = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COPY.PARTNERSHIP.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-16 text-right" dir="rtl">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic">
            FPL <span className="text-[#22c55e]">RUSH</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            المنصة العربية الأولى لتحديات الفانتازي "المخصصة". نضع القواعد، وأنت تضع التشكيل.
          </p>
        </motion.div>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {[
            {
              title: "تحديات مخصصة",
              desc: "نظام Customized بالكامل؛ تحديات تبدأ وتنتهي في جولات محددة حسب رغبة الشريك أو المنصة.",
              icon: <Zap className="text-[#22c55e]" />
            },
            {
              title: "فلترة صارمة",
              desc: "لا مكان للحسابات الوهمية. الدخول يتطلب معايير محددة (الترتيب العالمي، عمر الحساب، وإجمالي النقاط).",
              icon: <ShieldCheck className="text-[#22c55e]" />
            },
            {
              title: "تغطية شاملة",
              desc: "منصة مفتوحة لكل مدربي الوطن العربي، مع نظام جوائز ذكي للمسابقات المحلية.",
              icon: <Globe className="text-[#22c55e]" />
            }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/20 border border-white/5 hover:border-[#22c55e]/30 transition-all">
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Partnership Paths*/}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          <div className="relative p-1 bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem]">
            <div className="bg-slate-950 p-10 rounded-[2.4rem] h-full">
              <Trophy className="text-[#22c55e] mb-6" size={40} />
              <h3 className="text-2xl font-black mb-4 text-white">للعلامات التجارية</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                اربط اسمك بالإثارة. وفر جوائزك لمجتمع الفانتازي واحصل على ظهور استراتيجي في جولات الحسم.
              </p>
              <div className="text-[#22c55e] text-sm font-mono opacity-60 italic">#Brand_Recognition #Direct_Targeting</div>
            </div>
          </div>

          <div className="relative p-1 bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem]">
            <div className="bg-slate-950 p-10 rounded-[2.4rem] h-full">
              <Users className="text-[#22c55e] mb-6" size={40} />
              <h3 className="text-2xl font-black mb-4 text-white">لصناع المحتوى</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                أنشئ تحديك الخاص لمتابعيك بشروطك الخاصة. نحن نتولى الحسابات التقنية، وأنت تتولى المتعة.
              </p>
              <div className="text-[#22c55e] text-sm font-mono opacity-60 italic">#Content_Creators #Community_Growth</div>
            </div>
          </div>
        </section>

        
        <motion.div 
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          className="text-center bg-[#2E9454] p-16 rounded-[3rem] shadow-2xl shadow-[#22c55e]/10"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-950">هل أنت مستعد لبدء التحدي؟</h2>
          <p className="text-slate-900/70 mb-10 font-medium">تواصل مع فريق الإدارة لتنسيق تحديك القادم</p>
          
          <button
            onClick={handleCopy}
            className={`flex items-center gap-3 mx-auto px-8 py-4 rounded-full font-bold transition-all ${
              copied 
              ? "bg-slate-950 text-[#22c55e]" 
              : "bg-white text-slate-950 hover:bg-slate-100 shadow-lg"
            }`}
          >
            {copied ? (
              <>تم نسخ البريد الإلكتروني <Check size={20} /></>
            ) : (
              <>نسخ البريد الرسمي <Copy size={20} /></>
            )}
          </button>
          
          <p className="mt-6 text-slate-900/50 font-mono text-sm tracking-widest lowercase">
            {COPY.PARTNERSHIP.email}
          </p>
        </motion.div>

        {/* Footer Note */}
        <p className="text-center mt-12 text-gray-600 text-sm">
          جميع التحديات تخضع لنظام التحقق الآلي لضمان نزاهة النتائج.
        </p>
      </div>
    </Layout>
  );
};

export default PartnershipPage;