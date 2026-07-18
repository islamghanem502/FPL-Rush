import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useUser, useChallenges, usePvPChallenges } from '../hooks/useAuthQuery';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: user, isLoading: userLoading, isError: userError, error: userApiError } = useUser();
  const { data: challengesRaw, isLoading: challengesLoading } = useChallenges();
  const { data: pvpRaw, isLoading: pvpLoading } = usePvPChallenges();

  // مدمج ومرتب
  const challenges = React.useMemo(() => {
    const combined = [...(challengesRaw || []), ...(pvpRaw || [])];
    return combined.sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [challengesRaw, pvpRaw]);

  // تصفية التحديات بناءً على البحث
  const filteredChallenges = challenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // حسابات Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChallenges = filteredChallenges.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);

  if (userLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold animate-pulse text-xl">جاري تحضير تشكيلتك من السيرفر... ⚽</p>
        </div>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-500/10 border border-red-500 p-8 rounded-[40px] inline-block">
            <h2 className="text-white text-2xl font-black mb-4">عذراً، تعذر جلب البيانات ❌</h2>
            <p className="text-gray-400 mb-6">{userApiError?.response?.data?.message || "تأكد من اتصالك بالإنترنت"}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-8 py-3 rounded-2xl font-black hover:bg-[#22c55e] transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* =========================================
            Header Section (تم تصميمه بشكل احترافي وسيمبل)
        ========================================= */}
        <header className="mb-6 md:mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-right">

          {/* رسالة الترحيب */}
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white">
              أهلاً يا بطل، <span className="text-[#22c55e]">{user?.managerName}</span> ⚽
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium">مستعد لتحديات الجولة الجديدة؟</p>
          </div>

          {/* الإحصائيات (تصميم زجاجي أنيق) */}
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 md:px-8 md:py-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
              <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 md:mb-2">إجمالي النقاط</span>
              <span className="text-3xl md:text-4xl font-black text-white">{user?.totalPoints?.toLocaleString()}</span>
            </div>

            <div className="flex-1 lg:flex-none bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 md:px-8 md:py-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent opacity-80"></div>
              <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 md:mb-2 truncate max-w-full">نقاط الجولة {user?.currentEvent}</span>
              <span className="text-3xl md:text-4xl font-black text-[#22c55e]">{user?.lastGwPoints}</span>
            </div>
          </div>
        </header>



        {/* =========================================
            Team Info Card (تصميم لوحة تحكم مدمجة)
        ========================================= */}
        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-8 md:mb-12 text-right shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0">

            {/* بيانات الفريق الأساسية */}
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">فريقك الحالي</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">{user?.teamName}</h2>
              <div className="flex gap-4 mt-1 text-sm text-gray-400 font-medium">
                <p>FPL ID: <span className="text-gray-300">{user?.fpl_id}</span></p>
                <span className="text-slate-700 hidden sm:block">|</span>
                <p className="hidden sm:block">Email: <span className="text-gray-300">{user?.email}</span></p>
              </div>
            </div>

            {/* الفاصل في الموبايل واللابتوب */}
            <div className="hidden md:block w-px h-16 bg-slate-800 mx-8"></div>
            <div className="w-full h-px bg-slate-800 md:hidden my-2"></div>

            {/* بيانات الترتيب والبداية */}
            <div className="flex gap-10 md:gap-12 w-full md:w-auto justify-start md:justify-end">
              <div className="text-right">
                <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">الترتيب العام</p>
                <p className="text-[#22c55e] font-black text-xl md:text-2xl">#{user?.overallRank?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">انضم من</p>
                <p className="text-white font-black text-xl md:text-2xl">GW {user?.startedEvent}</p>
              </div>
            </div>

          </div>
        </div>

        {/* =========================================
            Live Bonus Tracker Button (Stlye matching Landing Page)
        ========================================= */}
        <div className="flex justify-center md:justify-end mb-10 -mt-2">
          <Link
            to="/bonus"
            className="group flex items-center gap-3 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-600/50 hover:border-[#22c55e]/60 text-white font-bold text-sm md:text-base px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span>تابع بونص اللاعبين</span>
            <span className="text-[#22c55e] text-xs md:text-sm font-semibold group-hover:translate-x-1 transition-transform tracking-tighter">Live →</span>
          </Link>
        </div>

        {/* =========================================
            Missing Contact Banner (Small & Yellow)
        ========================================= */}
        {(!user?.email && !user?.phone) && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-3 md:p-4 mb-8 md:mb-12 flex flex-col sm:flex-row items-center justify-between text-right gap-3 shadow-md">
            <div>
              <p className="text-yellow-500 font-bold text-xs md:text-sm">⚠️ لتسهيل تسليم الجوائز، يرجى إضافة وسيلة تواصل.</p>
            </div>
            <Link to="/profile" className="w-full sm:w-auto bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 outline-none font-bold py-1.5 px-4 rounded-lg transition-colors text-center text-xs whitespace-nowrap">
              إضافة الآن
            </Link>
          </div>
        )}

        {/* Search & Tabs Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-10">
          <nav className="flex gap-1 md:gap-2 bg-slate-900/50 p-1.5 md:p-2 rounded-2xl w-full md:w-fit border border-slate-800">
            <button
              onClick={() => { setActiveTab('available'); setCurrentPage(1); }}
              className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-4 rounded-xl text-sm md:text-base font-black transition-all duration-300 ${activeTab === 'available' ? 'bg-[#22c55e] text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              تحديات متاحة
            </button>
            <button
              onClick={() => { setActiveTab('my'); setCurrentPage(1); }}
              className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-4 rounded-xl text-sm md:text-base font-black transition-all duration-300 ${activeTab === 'my' ? 'bg-[#22c55e] text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              تحدياتي ({user?.joinedChallenges?.length || 0})
            </button>
          </nav>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="ابحث عن تحدي..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900/50 border border-slate-800 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl focus:outline-none focus:border-[#22c55e] transition-colors text-right text-sm md:text-base"
            />
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {activeTab === 'available' ? (
            challengesLoading || pvpLoading ? (
              <div className="col-span-full py-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold">جاري تحميل التحديات الجديدة...</p>
              </div>
            ) : currentChallenges.length > 0 ? (
              currentChallenges.map((challenge) => (
                <ChallengeCard key={challenge._id} challenge={challenge} />
              ))
            ) : (
              <div className="col-span-full py-16 md:py-20 text-center bg-slate-800/10 rounded-[30px] md:rounded-[40px] border-4 border-dashed border-slate-800/50">
                <p className="text-gray-500 text-lg md:text-xl font-bold italic">لا توجد تحديات تطابق بحثك حالياً.</p>
              </div>
            )
          ) : (
            user?.joinedChallenges && user.joinedChallenges.length > 0 ? (
              user.joinedChallenges.map((item) => {
                const challengeInfo = challenges?.find(c => c._id === item.challengeId);
                const isPvP = !!challengeInfo?.matchups;
                return (
                  <div key={item._id} className={`bg-slate-900/60 rounded-[24px] md:rounded-[32px] p-6 md:p-8 border ${isPvP ? 'border-purple-500/50 hover:border-purple-500' : 'border-[#22c55e]/50 hover:border-[#22c55e]'} relative overflow-hidden group transition-all text-right shadow-lg`}>
                    <div className={`absolute top-0 right-0 ${isPvP ? 'bg-purple-500' : 'bg-[#22c55e]'} text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter italic`}>Joined</div>

                    <h3 className="text-lg md:text-xl font-black text-white mb-6">
                      {challengeInfo?.title || "تحدي مشارك به"}
                    </h3>

                    <div className="space-y-4">
                      {!isPvP && (
                        <div className="flex justify-between border-b border-slate-700/50 pb-3">
                          <span className="text-gray-400 text-xs font-medium">نقاطك عند الانضمام</span>
                          <span className="text-white font-bold">{item.initialPoints}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400 text-sm font-medium">نقاطك في التحدي</span>
                        <span className={`text-3xl md:text-4xl font-black ${isPvP ? 'text-purple-400' : 'text-[#22c55e]'}`}>
                          {isPvP ? "PvP" : (user.totalPoints - item.initialPoints).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Link to={`/challenge/${item.challengeId}`} className={`block mt-8 text-center text-xs font-bold text-gray-500 ${isPvP ? 'hover:text-purple-400' : 'hover:text-[#22c55e]'} transition-colors underline decoration-dotted underline-offset-4`}>
                      فتح جدول الترتيب والمركز الحالي
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 md:py-20 text-center bg-slate-800/10 rounded-[30px] md:rounded-[40px] border-4 border-dashed border-slate-800/50">
                <p className="text-gray-500 text-lg md:text-xl font-bold italic">لم تشترك في أي تحديات بعد، ابدأ المنافسة الآن!</p>
              </div>
            )
          )}
        </div>

        {/* Pagination Controls */}
        {activeTab === 'available' && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10 md:mt-12">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 md:px-6 py-2 bg-slate-900/50 text-white rounded-xl border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#22c55e] transition-all font-bold text-sm md:text-base"
            >
              السابق
            </button>
            <span className="text-gray-400 font-bold text-xs md:text-sm">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 md:px-6 py-2 bg-slate-900/50 text-white rounded-xl border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#22c55e] transition-all font-bold text-sm md:text-base"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Component فرعي لكرت التحدي
const ChallengeCard = ({ challenge }) => {
  const isPvP = !!challenge.matchups;
  const themeText = isPvP ? "text-purple-400" : "text-[#22c55e]";
  const themeHoverBorder = isPvP ? "hover:border-purple-500/50" : "hover:border-[#22c55e]/50";
  const themeGroupText = isPvP ? "group-hover:text-purple-400" : "group-hover:text-[#22c55e]";
  const themeHoverBg = isPvP ? "hover:bg-purple-500" : "hover:bg-[#22c55e]";

  return (
    <>
      {/* =======================================================
          1. تصميم الموبايل (Image Overlay + قائمة الجوائز)
      ======================================================= */}
      <div className={`md:hidden relative h-[24rem] w-full rounded-[28px] overflow-hidden border border-slate-800 ${themeHoverBorder} transition-all duration-500 flex flex-col group shadow-xl text-right`}>

        {isPvP && challenge.status !== "finished" && (
          <div className="absolute top-0 right-0 bg-purple-500 text-white font-black px-8 py-1.5 rotate-45 translate-x-8 translate-y-4 shadow-xl z-20 italic text-[10px]">
            ⚔️ PvP
          </div>
        )}
        {!isPvP && challenge.status !== "finished" && (
          <div className="absolute top-0 right-0 bg-[#22c55e] text-slate-900 font-black px-8 py-1.5 rotate-45 translate-x-8 translate-y-4 shadow-xl z-20 italic text-[10px]">
            ✨ كلاسيك
          </div>
        )}
        {challenge.status === "finished" && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-black font-black px-8 py-1.5 rotate-45 translate-x-8 translate-y-4 shadow-xl z-20 italic text-[10px]">
            🏆 انتهى
          </div>
        )}

        <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
          {challenge.image ? (
            <img
              src={challenge.image}
              alt={challenge.title}
              className="w-full h-full object-cover opacity-100 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000"
            />
          ) : (
            <span className="text-6xl opacity-50">{isPvP ? "⚔️" : "🏆"}</span>
          )}
        </div>

        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

        <div className="absolute bottom-0 w-full p-5 z-10 flex flex-col gap-5">
          <div className="flex justify-between items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <h3 className="text-xl font-black leading-tight text-white shadow-sm">
                {challenge.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px]">
                {isPvP ? (
                  <span className="text-gray-300 font-bold italic">GW {challenge.gw}</span>
                ) : (
                  <span className="text-gray-300 font-bold italic">GW {challenge.startEvent} - {challenge.endEvent}</span>
                )}
                {isPvP && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className={`${themeText} font-bold`}>{challenge.matchups?.length || 0} مواجهات</span>
                  </>
                )}
              </div>
            </div>

            {/* الجوائز في الموبايل */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-2.5 rounded-xl flex flex-col gap-1.5 min-w-[110px]">
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-400 text-[9px] font-bold">المركز الأول</span>
                <span className={`${themeText} font-black text-sm`}>{challenge.prize}</span>
              </div>
              {challenge.prizeSecond && (
                <div className="flex justify-between items-center gap-3 border-t border-slate-700/50 pt-1.5">
                  <span className="text-gray-500 text-[9px] font-medium">المركز الثاني</span>
                  <span className="text-slate-300 text-xs font-bold">{challenge.prizeSecond}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            to={`/challenge/${challenge._id}`}
            className={`w-full text-center py-3.5 rounded-xl font-black text-sm transition-all border border-slate-700/50 shadow-lg ${challenge.status === "finished"
              ? "bg-slate-800/80 text-gray-400 cursor-not-allowed"
              : `bg-slate-900/80 text-white ${themeHoverBg} hover:text-slate-950 hover:border-transparent active:scale-95`
              }`}
          >
            {challenge.status === "finished" ? "التحدي مغلق" : "دخول التحدي"}
          </Link>
        </div>
      </div>

      {/* =======================================================
          2. تصميم اللابتوب (التصميم الأصلي مع تظبيط الجوائز)
      ======================================================= */}
      <div className={`hidden md:flex bg-slate-900/40 backdrop-blur-sm rounded-[32px] overflow-hidden border border-slate-800 ${themeHoverBorder} transition-all duration-500 flex-col group hover:shadow-[0_0_40px_rgba(${isPvP ? '168,85,247' : '34,197,94'},0.05)] text-right relative`}>

        {isPvP && challenge.status !== "finished" && (
          <div className="absolute top-0 right-0 bg-purple-500 text-white font-black px-10 py-2 rotate-45 translate-x-10 translate-y-6 shadow-xl z-20 italic text-sm">
            ⚔️ PvP
          </div>
        )}
        {!isPvP && challenge.status !== "finished" && (
          <div className="absolute top-0 right-0 bg-[#22c55e] text-slate-900 font-black px-10 py-2 rotate-45 translate-x-10 translate-y-6 shadow-xl z-20 italic text-sm">
            ✨ كلاسيك
          </div>
        )}

        {challenge.status === "finished" && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-black font-black px-10 py-2 rotate-45 translate-x-10 translate-y-6 shadow-xl z-20 italic text-sm">
            🏆 انتهى
          </div>
        )}

        <div className="h-52 overflow-hidden relative bg-slate-950 flex items-center justify-center">
          {challenge.image ? (
            <img
              src={challenge.image}
              alt={challenge.title}
              className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000"
            />
          ) : (
            <span className="text-6xl opacity-50">{isPvP ? "⚔️" : "🏆"}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>

        <div className="p-8 pt-0 -mt-8 relative z-10 flex flex-col flex-grow">

          {/* الجوائز في اللابتوب */}
          <div className="bg-slate-900/90 backdrop-blur-md w-fit p-4 rounded-2xl mb-5 border border-slate-700/50 self-end flex flex-col gap-2 min-w-[150px] shadow-lg">
            <div className="flex justify-between items-center gap-4">
              <span className="text-gray-400 text-[10px] font-bold uppercase">المركز الأول</span>
              <span className={`${themeText} font-black text-lg`}>{challenge.prize}</span>
            </div>
            {challenge.prizeSecond && (
              <div className="flex justify-between items-center gap-4 border-t border-slate-800 pt-2">
                <span className="text-gray-500 text-[10px] font-medium uppercase">المركز الثاني</span>
                <span className="text-slate-300 text-sm font-bold">{challenge.prizeSecond}</span>
              </div>
            )}
            {challenge.prizeThird && (
              <div className="flex justify-between items-center gap-4 border-t border-slate-800 pt-2">
                <span className="text-gray-500 text-[10px] font-medium uppercase">المركز الثالث</span>
                <span className="text-amber-600/90 text-sm font-bold">{challenge.prizeThird}</span>
              </div>
            )}
          </div>

          <h3 className={`text-2xl font-black mb-2 leading-tight ${themeGroupText} transition-colors text-white`}>
            {challenge.title}
          </h3>

          <div className="space-y-4 my-6 flex-grow">
            <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3">
              {isPvP ? (
                <span className="text-white font-bold italic">GW {challenge.gw}</span>
              ) : (
                <span className="text-white font-bold italic">GW {challenge.startEvent} — {challenge.endEvent}</span>
              )}
              <span className="text-gray-500 font-bold uppercase text-[10px]">الجولات</span>
            </div>
            {isPvP && (
              <div className="flex justify-between items-center text-sm">
                <span className={`${themeText} font-bold italic`}>{challenge.matchups?.length || 0} مواجهات</span>
                <span className="text-gray-500 font-bold uppercase text-[10px]">المعارك</span>
              </div>
            )}
          </div>

          <Link
            to={`/challenge/${challenge._id}`}
            className={`w-full text-center py-4 rounded-xl font-black transition-all border border-slate-700/50 shadow-md ${challenge.status === "finished"
              ? "bg-slate-800/50 text-gray-500 cursor-not-allowed"
              : `bg-slate-900 text-white ${themeHoverBg} hover:text-slate-950 hover:scale-[1.02] active:scale-95`
              }`}
          >
            {challenge.status === "finished" ? "التحدي مغلق" : "دخول التحدي"}
          </Link>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;