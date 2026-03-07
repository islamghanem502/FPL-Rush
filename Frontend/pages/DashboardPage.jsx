import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useUser, useChallenges } from '../hooks/useAuthQuery';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: user, isLoading: userLoading, isError: userError, error: userApiError } = useUser();
  const { data: challengesRaw, isLoading: challengesLoading } = useChallenges();
  const challenges = challengesRaw || [];

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
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 text-right">
          <div>
            <h1 className="text-5xl font-black mb-4 italic tracking-tighter text-white leading-tight">
              أهلاً يا بطل،
              <span className="text-[#22c55e]"> {user?.managerName}</span> ⚽
            </h1>
            <p className="text-gray-400 text-lg font-medium">أثبت مهارتك في أصعب تحديات الفانتزي في مصر.</p>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-6 justify-start">
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col items-center min-w-[140px] md:min-w-[160px] shadow-xl">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">إجمالي النقاط</span>
              <span className="text-4xl font-black text-[#22c55e]">{user?.totalPoints?.toLocaleString()}</span>
            </div>

            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col items-center min-w-[140px] md:min-w-[160px] shadow-xl">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">نقاط الجولة {user?.currentEvent}</span>
              <span className="text-3xl font-black text-white">{user?.lastGwPoints}</span>
            </div>
          </div>
        </header>

        {/* Team Info Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 mb-10 text-right">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">الفريق</h3>
              <p className="text-2xl font-black text-white">{user?.teamName}</p>
              <p className="text-gray-400 text-sm italic">مدير الفريق: {user?.managerName}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">الحساب</h3>
              <p className="text-gray-400 text-sm">Team ID: <span className="text-white font-bold">{user?.teamId}</span></p>
              <p className="text-gray-400 text-sm">Email: <span className="text-white font-bold">{user?.email}</span></p>
            </div>

            <div className="flex gap-6 justify-start">
              <div className="text-right">
                <p className="text-gray-400 text-[10px]">الترتيب</p>
                <p className="text-[#22c55e] font-black text-lg">#{user?.overallRank?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[10px]">بداية اللعب من</p>
                <p className="text-white font-bold text-lg">GW {user?.startedEvent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tabs Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <nav className="flex gap-2 bg-slate-800/50 p-2 rounded-2xl w-fit border border-slate-700">
            <button
              onClick={() => { setActiveTab('available'); setCurrentPage(1); }}
              className={`px-6 md:px-10 py-4 rounded-xl font-black transition-all duration-300 ${activeTab === 'available' ? 'bg-[#22c55e] text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-white'
                }`}
            >
              تحديات متاحة
            </button>
            <button
              onClick={() => { setActiveTab('my'); setCurrentPage(1); }}
              className={`px-6 md:px-10 py-4 rounded-xl font-black transition-all duration-300 ${activeTab === 'my' ? 'bg-[#22c55e] text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-gray-400 hover:text-white'
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
              className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-[#22c55e] text-right"
            />
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {activeTab === 'available' ? (
            challengesLoading ? (
              <div className="col-span-full py-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-bold">جاري تحميل التحديات الجديدة...</p>
              </div>
            ) : currentChallenges.length > 0 ? (
              currentChallenges.map((challenge) => (
                <ChallengeCard key={challenge._id} challenge={challenge} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-[40px] border-4 border-dashed border-slate-800">
                <p className="text-gray-500 text-xl font-bold italic">لا توجد تحديات تطابق بحثك حالياً.</p>
              </div>
            )
          ) : (
            user?.joinedChallenges && user.joinedChallenges.length > 0 ? (
              user.joinedChallenges.map((item) => {
                const challengeInfo = challenges?.find(c => c._id === item.challengeId);
                return (
                  <div key={item._id} className="bg-slate-800 rounded-[32px] p-8 border border-[#22c55e] relative overflow-hidden group hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all text-right">
                    <div className="absolute top-0 right-0 bg-[#22c55e] text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter italic">Joined</div>

                    <h3 className="text-xl font-black text-white mb-6">
                      {challengeInfo?.title || "تحدي مشارك به"}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-slate-700/50 pb-2">
                        <span className="text-gray-400 text-xs italic">نقاطك عند الانضمام</span>
                        <span className="text-white font-bold">{item.initialPoints}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-400 text-sm">نقاطك في التحدي</span>
                        <span className="text-4xl font-black text-[#22c55e]">
                          {(user.totalPoints - item.initialPoints).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Link to={`/challenge/${item.challengeId}`} className="block mt-8 text-center text-xs font-bold text-gray-500 hover:text-[#22c55e] transition-colors underline decoration-dotted">
                      فتح جدول الترتيب والمركز الحالي
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-[40px] border-4 border-dashed border-slate-800">
                <p className="text-gray-500 text-xl font-bold italic">لم تشترك في أي تحديات بعد، ابدأ المنافسة الآن!</p>
              </div>
            )
          )}
        </div>

        {/* Pagination Controls */}
        {activeTab === 'available' && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#22c55e] transition-all font-bold"
            >
              السابق
            </button>
            <span className="text-gray-400 font-bold text-sm">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#22c55e] transition-all font-bold"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Component فرعي لكرت التحدي (Available Challenges)
const ChallengeCard = ({ challenge }) => (
  <div className="bg-slate-800 rounded-[32px] overflow-hidden border border-slate-700 hover:border-[#22c55e] transition-all duration-500 flex flex-col group hover:shadow-[0_0_40px_rgba(34,197,94,0.1)] text-right relative">
    
    {/* شارة التحدي المنتهي */}
    {challenge.status === "finished" && (
      <div className="absolute top-0 right-0 bg-yellow-500 text-black font-black px-6 sm:px-10 py-1 sm:py-2 rotate-45 translate-x-6 sm:translate-x-10 translate-y-4 sm:translate-y-6 shadow-xl z-20 italic text-xs sm:text-sm">
        🏆 انتهى
      </div>
    )}

    <div className="h-52 overflow-hidden relative">
      <img
        src={challenge.image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"}
        alt={challenge.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent"></div>
    </div>
    <div className="p-8 pt-0 -mt-10 relative z-10 flex flex-col flex-grow">
      <div className="bg-slate-900 w-fit p-3 rounded-2xl mb-4 border border-slate-700 self-end space-y-1">
        <p className="text-[#22c55e] font-black text-xl">{challenge.prize}</p>
        {challenge.prizeSecond && <p className="text-slate-300 text-sm font-bold">2: {challenge.prizeSecond}</p>}
        {challenge.prizeThird && <p className="text-amber-600/90 text-sm font-bold">3: {challenge.prizeThird}</p>}
      </div>
      <h3 className="text-2xl font-black mb-2 leading-tight group-hover:text-[#22c55e] transition-colors text-white">
        {challenge.title}
      </h3>
      <div className="space-y-4 my-6 flex-grow">
        <div className="flex justify-between items-center text-sm">
          <span className="text-white font-black italic">GW {challenge.startEvent} — {challenge.endEvent}</span>
          <span className="text-gray-500 font-bold uppercase text-[10px]">الجولات</span>
        </div>
      </div>
      <Link
        to={`/challenge/${challenge._id}`}
        className={`w-full text-center py-5 rounded-2xl font-black transition-all border border-slate-700 shadow-lg ${
          challenge.status === "finished" 
          ? "bg-slate-700 text-gray-400 cursor-not-allowed" 
          : "bg-slate-900 text-white hover:bg-[#22c55e] hover:text-slate-950 hover:scale-[1.02] active:scale-95"
        }`}
      >
        {challenge.status === "finished" ? "التحدي مغلق" : "دخول التحدي"}
      </Link>
    </div>
  </div>
);

export default DashboardPage;