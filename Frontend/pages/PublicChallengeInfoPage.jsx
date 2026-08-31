import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const PublicChallengeInfoPage = () => {
  const whatsappBase = import.meta.env.VITE_PUBLIC_CHALLENGE_WHATSAPP || 'https://wa.me/201094474067';
  const message = encodeURIComponent('مرحباً، أريد إنشاء تحدٍ عام على FPL Rush. أرجو التواصل معي لمعرفة التفاصيل والأسعار.');
  const whatsappUrl = `${whatsappBase}${whatsappBase.includes('?') ? '&' : '?'}text=${message}`;

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-right" dir="rtl">
        <Link to="/dashboard" className="inline-flex text-sm font-black text-gray-400 hover:text-[#22c55e] transition-colors">← رجوع إلى التحديات</Link>

        <section className="mt-5 rounded-3xl border border-[#22c55e]/30 bg-gradient-to-b from-[#22c55e]/10 via-slate-900 to-slate-950 p-5 sm:p-8 md:p-10 overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-[#22c55e]/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-3 py-1 text-[10px] font-black text-[#22c55e]">PUBLIC CHALLENGE</span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white">أنشئ تحديًا عامًا يصل لكل لاعبي FPL Rush</h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-gray-300">التحدي العام مناسب لصناع المحتوى، الجروبات الكبيرة، والبراندات. نرتب معك التفاصيل قبل النشر حتى تكون الشروط والجوائز واضحة للمشاركين.</p>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                ['ظهور لكل المستخدمين', 'يظهر التحدي في صفحة الاستكشاف ويدخل إليه اللاعبون المطابقون للشروط.'],
                ['تنظيم ودعم', 'نساعد في ضبط القواعد والجولات والترتيب وإغلاق التحدي بشكل موثوق.'],
                ['جوائز وخطة نشر', 'نتفق معك على الجوائز وطريقة الإعلان قبل تحويله إلى تحدٍ عام.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 sm:p-5">
                  <h2 className="font-black text-white">{title}</h2>
                  <p className="mt-2 text-xs sm:text-sm leading-6 text-gray-400">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              الأسعار والدفع سيُضافان لاحقًا. حاليًا نتواصل معك مباشرة لتجهيز التحدي العام بصورة مناسبة.
            </div>

            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-7 block w-full sm:w-fit rounded-2xl bg-[#22c55e] px-6 py-4 text-center font-black text-slate-950 hover:bg-white active:scale-[0.98] transition-all">
              تواصل عبر واتساب لإنشاء تحدٍ عام
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PublicChallengeInfoPage;
