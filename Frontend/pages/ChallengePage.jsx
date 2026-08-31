import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  useChallengeDetails,
  useChallengeStandings,
  useEnrollChallenge,
  useSetOwnerParticipation,
  useUser,
} from '../hooks/useAuthQuery';

const condition = (label, value, met) => (
  <div className={`rounded-xl p-3 border ${met ? 'border-[#22c55e]/30 bg-[#22c55e]/5' : 'border-red-500/20 bg-red-500/5'}`}>
    <p className="text-[11px] text-gray-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${met ? 'text-white' : 'text-red-300'}`}>{value}</p>
  </div>
);

const challengeStatusLabel = {
  active: 'نشط',
  closing: 'جارٍ تثبيت النتائج',
  finished: 'منتهي',
  cancelled: 'ملغي',
  draft: 'مسودة'
};

const ChallengePage = () => {
  const { id } = useParams();
  const { data: user } = useUser();
  const { data: challenge, isLoading, error } = useChallengeDetails(id);
  const { data: standings = [], isLoading: standingsLoading } = useChallengeStandings(id, challenge?.status);
  const enrollMutation = useEnrollChallenge();
  const ownerParticipationMutation = useSetOwnerParticipation();

  const checks = useMemo(() => ({
    points: Number(user?.totalPoints || 0) >= Number(challenge?.minTotalPoints || 0),
    rank: Number(user?.overallRank || Number.MAX_SAFE_INTEGER) <= Number(challenge?.maxOverallRank || 10000000),
    started: Number(user?.startedEvent || 999) <= Number(challenge?.latestStartedEvent || 38),
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

  const changeOwnerMode = (mode) => ownerParticipationMutation.mutate(
    { id, mode },
    { onError: (requestError) => alert(requestError.response?.data?.message || 'تعذر تغيير وضع المالك') }
  );

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
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${challenge.visibility === 'private' ? 'bg-violet-500/20 text-violet-200 border border-violet-400/30' : 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'}`}>{challenge.visibility === 'private' ? 'خاص' : 'عام'}</span>
              <span className="rounded-full bg-slate-800 text-gray-300 px-3 py-1 text-[10px] font-black">{challengeStatusLabel[challenge.status] || challenge.status}</span>
              {challenge.isOwner && <span className="rounded-full bg-white/10 text-white px-3 py-1 text-[10px] font-black">أنت المالك</span>}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-5 sm:items-start justify-between">
              <div className="min-w-0">
                <h1 className="break-words text-3xl sm:text-4xl font-black text-white">{challenge.title}</h1>
                {challenge.description && <p className="mt-3 text-gray-300 whitespace-pre-line leading-relaxed">{challenge.description}</p>}
                {challenge.descriptionLinks?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
                  {challenge.descriptionLinks.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-bold text-sky-200 hover:bg-sky-400/20"><span className="truncate">{link.label || link.url}</span><span className="mr-2 text-xs opacity-70">↗</span></a>)}
                </div>}
              </div>
              {challenge.image && <img src={challenge.image} alt="" className="w-24 h-24 rounded-2xl object-cover border border-slate-600" />}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-xl bg-slate-800 px-4 py-3 text-[#22c55e]">GW {challenge.startEvent} – {challenge.endEvent}</span>
              <span className="rounded-xl bg-slate-800 px-4 py-3 text-gray-200">{challenge.participantCount || 0} مشارك</span>
              {[['🥇', challenge.prize], ['🥈', challenge.prizeSecond], ['🥉', challenge.prizeThird]].filter(([, value]) => value).map(([icon, value]) => <span key={`${icon}-${value}`} className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-yellow-300">{icon} {value}</span>)}
            </div>
            {challenge.visibility === 'public' && !challenge.isJoined && challenge.status === 'active' && <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {condition('النقاط', `+${challenge.minTotalPoints}`, checks.points)}
              {condition('الترتيب', `حتى #${Number(challenge.maxOverallRank).toLocaleString()}`, checks.rank)}
              {condition('بداية FPL', `حتى GW ${challenge.latestStartedEvent}`, checks.started)}
              {condition('التسجيل', `حتى GW ${challenge.endEvent}`, checks.notEnded)}
            </div>}
            {challenge.visibility === 'private' && !challenge.isJoined && !challenge.isOwner && <p className="mt-6 text-amber-300">للانضمام إلى هذا التحدي، استخدم رابط الدعوة الخاص به.</p>}
            {challenge.visibility === 'private' && challenge.isOwner && challenge.status === 'active' && <div className="mt-6 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
              <p className="text-sm font-black text-white">وضعك كمالك التحدي</p>
              <p className="mt-1 text-xs text-gray-300">يمكنك مراقبة التحدي أو الظهور ضمن جدول الترتيب كمشارك.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button disabled={ownerParticipationMutation.isPending || challenge.ownerParticipation === 'participant'} onClick={() => changeOwnerMode('participant')} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{challenge.ownerParticipation === 'participant' ? 'أنت مشارك' : 'أشارك في التحدي'}</button>
                <button disabled={ownerParticipationMutation.isPending || challenge.ownerParticipation !== 'participant'} onClick={() => changeOwnerMode('observer')} className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-black text-gray-200 disabled:opacity-50">أكتفي بالمراقبة</button>
              </div>
            </div>}
            <div className="mt-7">
              {challenge.isJoined ? <div className="rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 py-4 text-center font-black text-[#22c55e]">أنت منضم إلى هذا التحدي ✓</div>
                : challenge.visibility === 'public' && challenge.status === 'active' ? <button disabled={!canEnroll || enrollMutation.isPending} onClick={enroll} className="w-full rounded-xl bg-[#22c55e] py-4 font-black text-slate-950 disabled:opacity-50">{enrollMutation.isPending ? 'جارٍ الانضمام...' : canEnroll ? 'انضم الآن' : 'لا تطابق شروط الانضمام'}</button>
                  : null}
            </div>
          </div>
        </section>

        {challenge.status === 'closing' && <section className="mt-7 rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5 text-center">
          <p className="font-black text-amber-200">جارٍ تثبيت النتائج النهائية</p>
          <p className="mt-1 text-sm text-amber-100/70">لن يتم إعلان الفائزين حتى يؤكد FPL اكتمال الجولة والبونص.</p>
        </section>}

        {challenge.status === 'finished' && challenge.winners?.length > 0 && <section className="mt-7 rounded-3xl overflow-hidden bg-slate-900/75 border border-yellow-500/25">
          <header className="px-6 py-5 border-b border-yellow-500/20"><h2 className="text-xl font-black text-yellow-200">لوحة الشرف</h2><p className="mt-1 text-xs text-gray-400">أوائل التحدي بعد تثبيت نتائج الجولة</p></header>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-6">
            {challenge.winners.map((winner) => {
              const medal = { 1: '🥇', 2: '🥈', 3: '🥉' }[winner.rank] || '🏅';
              return <article key={`${winner.userId}-${winner.rank}`} className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
                <div className="text-3xl">{medal}</div>
                <p className="mt-2 font-black text-white break-words">{winner.teamName || 'فريق FPL'}</p>
                <p className="mt-1 text-xs text-gray-400 break-words">{winner.managerName || 'مدرب'}</p>
                <p className="mt-3 text-2xl font-black text-yellow-200">{winner.points}</p>
                <p className="text-[11px] text-gray-500">نقطة</p>
              </article>;
            })}
          </div>
        </section>}

        <section className="mt-7 rounded-3xl overflow-hidden bg-slate-900/75 border border-slate-700">
          <header className="px-6 py-5 border-b border-slate-700"><h2 className="text-xl font-black text-white">{challenge.status === 'finished' ? 'الترتيب النهائي' : challenge.status === 'closing' ? 'جارٍ تثبيت النتائج' : 'جدول الترتيب'}</h2></header>
          {standingsLoading ? <div className="p-12 text-center text-gray-400">جارٍ تحميل الترتيب...</div> : standings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[500px]"><thead className="bg-slate-950/40 text-gray-500 text-xs"><tr><th className="p-4 text-center">#</th><th className="p-4 text-right">الفريق / المدرب</th><th className="p-4 text-center">نقاط التحدي</th></tr></thead><tbody>{standings.map((entry, index) => <tr key={entry.userId} className={`border-t border-slate-800 ${entry.userId === user?._id ? 'bg-[#22c55e]/10' : ''}`}><td className="p-4 text-center font-black text-[#22c55e]">{index + 1}</td><td className="p-4"><p className="font-black text-white">{entry.teamName}</p><p className="text-xs text-gray-500">{entry.managerName}</p></td><td className="p-4 text-center text-xl font-black text-white">{entry.challengePoints}</td></tr>)}</tbody></table></div> : <div className="p-12 text-center text-gray-500">لا يوجد مشاركون بعد.</div>}
        </section>
      </main>
    </Layout>
  );
};

export default ChallengePage;
