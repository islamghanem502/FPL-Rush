import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  useChallengeDetails,
  useChallengeStandings,
  useEnrollChallenge,
  useUser,
} from '../hooks/useAuthQuery';

const condition = (label, value, met) => (
  <div className={`rounded-xl p-3 border ${met ? 'border-[#22c55e]/30 bg-[#22c55e]/5' : 'border-red-500/20 bg-red-500/5'}`}>
    <p className="text-[11px] text-gray-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${met ? 'text-white' : 'text-red-300'}`}>{value}</p>
  </div>
);

const ChallengePage = () => {
  const { id } = useParams();
  const { data: user } = useUser();
  const { data: challenge, isLoading, error } = useChallengeDetails(id);
  const { data: standings = [], isLoading: standingsLoading } = useChallengeStandings(id);
  const enrollMutation = useEnrollChallenge();

  const checks = useMemo(() => ({
    points: Number(user?.totalPoints || 0) >= Number(challenge?.minTotalPoints || 0),
    rank: Number(user?.overallRank || Number.MAX_SAFE_INTEGER) <= Number(challenge?.maxOverallRank || 10000000),
    started: Number(user?.startedEvent || 999) <= Number(challenge?.latestStartedEvent || 38),
    league: !challenge?.requiresPlatformLeagueMembership || Boolean(user?.isVerified),
    notEnded: Number(user?.currentEvent || 0) <= Number(challenge?.endEvent || 0),
  }), [challenge, user]);

  const canEnroll = challenge?.visibility === 'public'
    && challenge?.status === 'active'
    && !challenge?.isJoined
    && Object.values(checks).every(Boolean);

  const enroll = () => {
    if (!window.confirm(`هل تريد الانضمام إلى «${challenge.title}»؟`)) return;
    enrollMutation.mutate(id, {
      onError: (requestError) => alert(requestError.response?.data?.message || 'تعذر الانضمام إلى التحدي')
    });
  };

  if (isLoading) return <Layout><div className="min-h-[60vh] flex items-center justify-center text-white">جارٍ تحميل التحدي...</div></Layout>;
  if (error || !challenge) return <Layout><div className="min-h-[60vh] flex items-center justify-center text-red-300">التحدي غير موجود أو لا تملك صلاحية الوصول إليه.</div></Layout>;

  return (
    <Layout>
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 text-right" dir="rtl">
        <Link to={challenge.visibility === 'private' ? '/my-challenges' : '/dashboard'} className="text-sm font-bold text-gray-400 hover:text-[#22c55e]">← رجوع</Link>
        <section className="mt-5 overflow-hidden rounded-3xl bg-slate-900/75 border border-slate-700">
          {challenge.backgroundImage && <div className="h-32 sm:h-44 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${challenge.backgroundImage})` }} />}
          <div className={`p-6 sm:p-8 ${challenge.backgroundImage ? '-mt-20 relative' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${challenge.visibility === 'private' ? 'bg-violet-500/20 text-violet-200 border border-violet-400/30' : 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'}`}>{challenge.visibility.toUpperCase()}</span>
              <span className="rounded-full bg-slate-800 text-gray-300 px-3 py-1 text-[10px] font-black">{challenge.status === 'active' ? 'نشط' : challenge.status}</span>
              {challenge.isOwner && <span className="rounded-full bg-white/10 text-white px-3 py-1 text-[10px] font-black">أنت المالك</span>}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
              <div><h1 className="text-3xl sm:text-4xl font-black text-white">{challenge.title}</h1><p className="mt-3 text-gray-300 whitespace-pre-line leading-relaxed">{challenge.description}</p></div>
              {challenge.image && <img src={challenge.image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-slate-600" />}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-xl bg-slate-800 px-4 py-3 text-[#22c55e]">GW {challenge.startEvent} – {challenge.endEvent}</span>
              <span className="rounded-xl bg-slate-800 px-4 py-3 text-gray-200">{challenge.participantCount || 0} مشارك</span>
              {challenge.prize && <span className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-yellow-300">🥇 {challenge.prize}</span>}
            </div>
            {challenge.visibility === 'public' && !challenge.isJoined && challenge.status === 'active' && <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {condition('النقاط', `+${challenge.minTotalPoints}`, checks.points)}
              {condition('الترتيب', `حتى #${Number(challenge.maxOverallRank).toLocaleString()}`, checks.rank)}
              {condition('بداية FPL', `حتى GW ${challenge.latestStartedEvent}`, checks.started)}
              {condition('دوري FPL Rush', challenge.requiresPlatformLeagueMembership ? 'مطلوب' : 'غير مطلوب', checks.league)}
              {condition('التسجيل', `حتى GW ${challenge.endEvent}`, checks.notEnded)}
            </div>}
            {challenge.visibility === 'private' && !challenge.isJoined && !challenge.isOwner && <p className="mt-6 text-amber-300">للانضمام إلى هذا التحدي، استخدم رابط الدعوة الخاص به.</p>}
            <div className="mt-7">
              {challenge.isJoined ? <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 py-4 text-center font-black text-[#22c55e]">أنت منضم إلى هذا التحدي ✓</div>
                : challenge.visibility === 'public' && challenge.status === 'active' ? <button disabled={!canEnroll || enrollMutation.isPending} onClick={enroll} className="w-full rounded-xl bg-[#22c55e] py-4 font-black text-slate-950 disabled:opacity-50">{enrollMutation.isPending ? 'جارٍ الانضمام...' : canEnroll ? 'انضم الآن' : 'لا تطابق شروط الانضمام'}</button>
                  : null}
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-3xl overflow-hidden bg-slate-900/75 border border-slate-700">
          <header className="px-6 py-5 border-b border-slate-700"><h2 className="text-xl font-black text-white">{challenge.status === 'finished' ? 'الترتيب النهائي' : 'جدول الترتيب'}</h2></header>
          {standingsLoading ? <div className="p-12 text-center text-gray-400">جارٍ تحميل الترتيب...</div> : standings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[500px]"><thead className="bg-slate-950/40 text-gray-500 text-xs"><tr><th className="p-4 text-center">#</th><th className="p-4 text-right">الفريق / المدرب</th><th className="p-4 text-center">نقاط التحدي</th></tr></thead><tbody>{standings.map((entry, index) => <tr key={entry.userId} className={`border-t border-slate-800 ${entry.userId === user?._id ? 'bg-[#22c55e]/10' : ''}`}><td className="p-4 text-center font-black text-[#22c55e]">{index + 1}</td><td className="p-4"><p className="font-black text-white">{entry.teamName}</p><p className="text-xs text-gray-500">{entry.managerName}</p></td><td className="p-4 text-center text-xl font-black text-white">{entry.challengePoints}</td></tr>)}</tbody></table></div> : <div className="p-12 text-center text-gray-500">لا يوجد مشاركون بعد.</div>}
        </section>
      </main>
    </Layout>
  );
};

export default ChallengePage;
