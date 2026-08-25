import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { usePublicChallenges, useUser } from '../hooks/useAuthQuery';

const PublicChallengeCard = ({ challenge }) => (
  <article className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 hover:border-[#22c55e]/50 transition-all text-right flex flex-col">
    <div className="h-40 bg-slate-950 relative overflow-hidden">
      {challenge.image ? <img src={challenge.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-5xl">🏆</div>}
      <span className="absolute top-3 right-3 rounded-full bg-[#22c55e] text-slate-950 px-3 py-1 text-[10px] font-black">PUBLIC</span>
    </div>
    <div className="p-5 flex flex-col flex-1">
      <div className="flex justify-between gap-3 items-start">
        <h2 className="text-xl font-black text-white leading-tight">{challenge.title}</h2>
        <span className="shrink-0 text-xs font-black text-[#22c55e]">GW {challenge.startEvent}–{challenge.endEvent}</span>
      </div>
      <p className="mt-3 text-sm text-gray-400 line-clamp-2">{challenge.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
        {challenge.prize && <span className="rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-3 py-2">🥇 {challenge.prize}</span>}
        <span className="rounded-lg bg-slate-800 text-gray-300 px-3 py-2">{challenge.participantCount || 0} مشارك</span>
      </div>
      <Link to={`/challenge/${challenge._id}`} className="mt-5 w-full text-center rounded-xl bg-slate-800 hover:bg-[#22c55e] hover:text-slate-950 py-3 text-sm font-black text-white transition-colors">
        {challenge.status === 'finished' ? 'عرض النتائج' : 'دخول التحدي'}
      </Link>
    </div>
  </article>
);

const DashboardPage = () => {
  const { data: user } = useUser();
  const { data: challenges = [], isLoading, isError } = usePublicChallenges();
  const [search, setSearch] = useState('');
  const visibleChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.title.toLowerCase().includes(search.toLowerCase())),
    [challenges, search]
  );
  const whatsappBase = import.meta.env.VITE_PUBLIC_CHALLENGE_WHATSAPP || 'https://wa.me/201094474067';
  const whatsappText = encodeURIComponent('مرحباً، أريد إنشاء تحدٍ عام على FPL Rush. أرجو التواصل معي لمعرفة التفاصيل والأسعار.');
  const whatsappUrl = `${whatsappBase}${whatsappBase.includes('?') ? '&' : '?'}text=${whatsappText}`;

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-right" dir="rtl">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#22c55e] font-black text-sm">FPL RUSH ARENA</p>
            <h1 className="mt-1 text-3xl sm:text-5xl font-black text-white">أهلاً {user?.managerName || 'يا بطل'} 👋</h1>
            <p className="mt-3 text-gray-400">استكشف التحديات العامة، أو اصنع تحديك الخاص وادعُ أصدقاءك.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[250px]">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-700 px-5 py-4"><p className="text-xs text-gray-500">إجمالي النقاط</p><p className="mt-1 text-2xl font-black text-white">{user?.totalPoints?.toLocaleString() || '—'}</p></div>
            <div className="rounded-2xl bg-slate-900/70 border border-slate-700 px-5 py-4"><p className="text-xs text-gray-500">ترتيبك العام</p><p className="mt-1 text-2xl font-black text-[#22c55e]">{user?.overallRank ? `#${user.overallRank.toLocaleString()}` : '—'}</p></div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12">
          <div className="rounded-3xl p-6 bg-gradient-to-l from-violet-500/20 to-slate-900 border border-violet-400/30">
            <p className="font-black text-violet-200">تحدٍ خاص لأصحابك</p>
            <h2 className="mt-2 text-2xl font-black text-white">اصنعه وشارك الرابط فقط مع من تختار</h2>
            <p className="mt-2 text-sm text-gray-300">الكود لا يظهر للعامة، والشروط والنقاط تعمل بنفس منطق التحديات العامة.</p>
            <Link to="/private-challenge/new" className="inline-block mt-5 rounded-xl bg-white text-slate-950 px-5 py-3 font-black text-sm">إنشاء تحدٍ خاص</Link>
          </div>
          <div className="rounded-3xl p-6 bg-gradient-to-l from-[#22c55e]/15 to-slate-900 border border-[#22c55e]/30">
            <p className="font-black text-[#22c55e]">تريد تحديًا عامًا؟</p>
            <h2 className="mt-2 text-2xl font-black text-white">نتواصل معك أولًا لتجهيزه ونشره</h2>
            <p className="mt-2 text-sm text-gray-300">الدفع والأسعار ستُضاف لاحقًا؛ حاليًا التواصل يتم مباشرة عبر واتساب.</p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-block mt-5 rounded-xl bg-[#22c55e] text-slate-950 px-5 py-3 font-black text-sm">تواصل عبر واتساب</a>
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-6">
            <div><p className="text-[#22c55e] text-sm font-black">PUBLIC CHALLENGES</p><h2 className="text-3xl font-black text-white">التحديات العامة</h2></div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن تحدٍ..." className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#22c55e]" />
          </div>
          {isLoading && <div className="p-16 text-center text-gray-400">جارٍ تحميل التحديات...</div>}
          {isError && <div className="p-12 text-center text-red-300">تعذر تحميل التحديات العامة.</div>}
          {!isLoading && !isError && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleChallenges.map((challenge) => <PublicChallengeCard key={challenge._id} challenge={challenge} />)}
          </div>}
          {!isLoading && !isError && !visibleChallenges.length && <p className="p-12 rounded-3xl border border-dashed border-slate-700 text-center text-gray-500">لا توجد تحديات عامة مطابقة الآن.</p>}
        </section>
      </main>
    </Layout>
  );
};

export default DashboardPage;
