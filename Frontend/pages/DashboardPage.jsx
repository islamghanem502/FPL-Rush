import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useMyChallenges, usePublicChallenges, useUser } from '../hooks/useAuthQuery';

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

const PrivateChallengeCard = ({ challenge, role }) => (
  <article className="rounded-3xl border border-violet-400/25 bg-slate-900/70 p-5 text-right hover:border-violet-300/60 transition-colors">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-500/15 border border-violet-400/30 px-3 py-1 text-[10px] font-black text-violet-200">PRIVATE</span>
          <span className="text-[11px] font-bold text-gray-400">{role === 'owner' ? 'أنشأته' : 'منضم إليه'}</span>
        </div>
        <h3 className="mt-3 truncate text-lg font-black text-white">{challenge.title}</h3>
      </div>
      <span className="shrink-0 text-xs font-black text-[#22c55e]">GW {challenge.startEvent}–{challenge.endEvent}</span>
    </div>
    <p className="mt-3 line-clamp-2 text-sm text-gray-400">{challenge.description || 'تحدي خاص للأصدقاء'}</p>
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-gray-300">
      <span className="rounded-lg bg-slate-800 px-3 py-2">{challenge.participantCount || 0} مشارك</span>
      <span className="rounded-lg bg-slate-800 px-3 py-2">{challenge.status === 'active' ? 'نشط' : challenge.status}</span>
    </div>
    <Link to={`/challenge/${challenge._id}`} className="mt-5 block w-full rounded-xl bg-slate-800 py-3 text-center text-sm font-black text-white hover:bg-violet-500/30 transition-colors">
      فتح التحدي
    </Link>
  </article>
);

const CreateChallengeModal = ({ isOpen, onClose, onOpenPublicPage, onCreatePrivate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <section className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-right" dir="rtl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-slate-700 gap-4">
          <div>
            <p className="text-xs font-black text-[#22c55e]">CREATE A CHALLENGE</p>
            <h2 className="mt-1 text-2xl font-black text-white">كيف تريد أن يكون تحديك؟</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-black" aria-label="إغلاق">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
            <button onClick={onCreatePrivate} className="group rounded-2xl border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/20 p-6 text-right transition-all focus:outline-none focus:ring-2 focus:ring-violet-300">
              <span className="inline-flex rounded-full bg-violet-500/20 border border-violet-300/30 px-3 py-1 text-[10px] font-black text-violet-200">PRIVATE</span>
              <h3 className="mt-4 text-2xl font-black text-white">تحدي خاص</h3>
              <p className="mt-3 text-sm leading-6 text-gray-300">تنشئه بنفسك الآن، تحدد الشروط والجولات، ثم تحصل على رابط وكود لدعوة الأشخاص الذين تختارهم فقط.</p>
              <span className="inline-block mt-5 text-sm font-black text-violet-200 group-hover:text-white">ابدأ إنشاء تحدٍ خاص ←</span>
            </button>

            <button onClick={onOpenPublicPage} className="group rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 p-6 text-right transition-all focus:outline-none focus:ring-2 focus:ring-[#22c55e]">
              <span className="inline-flex rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 px-3 py-1 text-[10px] font-black text-[#22c55e]">PUBLIC</span>
              <h3 className="mt-4 text-2xl font-black text-white">تحدي عام</h3>
              <p className="mt-3 text-sm leading-6 text-gray-300">يظهر لكل مستخدمي FPL Rush. نتواصل معك أولًا لتجهيز التفاصيل، التنظيم، والجوائز قبل نشره.</p>
              <span className="inline-block mt-5 text-sm font-black text-[#22c55e] group-hover:text-white">اعرف التفاصيل ←</span>
            </button>
        </div>
      </section>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: challenges = [], isLoading, isError } = usePublicChallenges();
  const { data: myChallenges } = useMyChallenges();
  const [search, setSearch] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [createStep, setCreateStep] = useState(null);
  const visibleChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.title.toLowerCase().includes(search.toLowerCase())),
    [challenges, search]
  );

  const openInvite = (event) => {
    event.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setInviteError('أدخل كود الدعوة أولًا.');
      return;
    }
    setInviteError('');
    navigate(`/join/${encodeURIComponent(code)}`);
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 text-right" dir="rtl">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[#22c55e] font-black text-sm">FPL RUSH ARENA</p>
            <h1 className="mt-1 text-3xl sm:text-5xl font-black text-white">أهلاً {user?.managerName || 'يا بطل'} 👋</h1>
            <p className="mt-3 text-gray-400">اكتشف التحديات العامة أو اصنع منافستك الخاصة مع أصدقائك.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[250px]">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-700 px-5 py-4"><p className="text-xs text-gray-500">إجمالي النقاط</p><p className="mt-1 text-2xl font-black text-white">{user?.totalPoints?.toLocaleString() || '—'}</p></div>
            <div className="rounded-2xl bg-slate-900/70 border border-slate-700 px-5 py-4"><p className="text-xs text-gray-500">ترتيبك العام</p><p className="mt-1 text-2xl font-black text-[#22c55e]">{user?.overallRank ? `#${user.overallRank.toLocaleString()}` : '—'}</p></div>
          </div>
        </header>

        <section className="mb-12 rounded-3xl border border-slate-700 bg-slate-900/65 p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <button onClick={() => setCreateStep('choose')} className="lg:w-56 shrink-0 rounded-2xl bg-[#22c55e] px-5 py-4 font-black text-slate-950 hover:bg-white transition-colors">
            + إنشاء تحدٍ
          </button>
          <div className="hidden lg:block h-12 w-px bg-slate-700" />
          <form onSubmit={openInvite} className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center">
            <label htmlFor="invite-code" className="shrink-0 text-sm font-black text-gray-200">لديك كود دعوة؟</label>
            <input id="invite-code" value={inviteCode} onChange={(event) => { setInviteCode(event.target.value); setInviteError(''); }} placeholder="أدخل كود التحدي الخاص" className="flex-1 bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-3 text-center tracking-widest uppercase text-white outline-none focus:border-violet-400" dir="ltr" autoComplete="off" />
            <button type="submit" className="w-full sm:w-auto rounded-xl border border-violet-400/50 px-5 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/15">دخول</button>
          </form>
          {inviteError && <p className="text-xs font-bold text-red-300">{inviteError}</p>}
        </section>

        {((myChallenges?.owned?.length || 0) + (myChallenges?.joined?.length || 0)) > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-violet-300 text-sm font-black">PRIVATE CHALLENGES</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">تحدياتك الخاصة</h2>
              </div>
              <Link to="/my-challenges" className="text-sm font-black text-violet-200 hover:text-white">إدارة كل التحديات ←</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {(myChallenges?.owned || []).map((challenge) => <PrivateChallengeCard key={`owned-${challenge._id}`} challenge={challenge} role="owner" />)}
              {(myChallenges?.joined || [])
                .filter((challenge) => !(myChallenges?.owned || []).some((ownedChallenge) => ownedChallenge._id === challenge._id))
                .map((challenge) => <PrivateChallengeCard key={`joined-${challenge._id}`} challenge={challenge} role="joined" />)}
            </div>
          </section>
        )}

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

      <CreateChallengeModal
        isOpen={Boolean(createStep)}
        onClose={() => setCreateStep(null)}
        onOpenPublicPage={() => navigate('/public-challenge')}
        onCreatePrivate={() => navigate('/private-challenge/new')}
      />
    </Layout>
  );
};

export default DashboardPage;
