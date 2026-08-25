import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  useDeleteChallenge,
  useMyChallenges,
  usePrivateInviteLink,
  useRotatePrivateInvite,
} from '../hooks/useAuthQuery';

const ChallengeRow = ({ challenge, owned }) => {
  const [copied, setCopied] = useState(false);
  const { data: invite } = usePrivateInviteLink(challenge._id, owned);
  const rotateInvite = useRotatePrivateInvite();
  const removeMutation = useDeleteChallenge();
  const activeInvite = rotateInvite.data?.data || invite;

  const copyLink = async () => {
    if (!activeInvite?.inviteUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${activeInvite.inviteUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const remove = () => {
    if (window.confirm(`حذف تحدي «${challenge.title}»؟`)) {
      removeMutation.mutate(challenge._id, { onError: (error) => alert(error.response?.data?.message || 'تعذر الحذف') });
    }
  };

  return (
    <article className="bg-slate-900/70 border border-slate-700 hover:border-[#22c55e]/50 rounded-3xl p-5 sm:p-6 text-right">
      <div className="flex justify-between gap-4 items-start">
        <div>
          <span className="inline-block text-[10px] font-black bg-violet-500/15 border border-violet-400/30 text-violet-300 rounded-full px-3 py-1">PRIVATE</span>
          <h3 className="mt-3 text-xl font-black text-white">{challenge.title}</h3>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">{challenge.description}</p>
        </div>
        <span className="text-xs font-black text-[#22c55e] shrink-0">GW {challenge.startEvent}–{challenge.endEvent}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-gray-300">
        <span className="bg-slate-800 rounded-lg px-3 py-2">{challenge.participantCount || 0} مشارك</span>
        <span className="bg-slate-800 rounded-lg px-3 py-2">{challenge.status === 'active' ? 'نشط' : challenge.status}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/challenge/${challenge._id}`} className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-sm font-black">فتح التحدي</Link>
        {owned && <Link to={`/private-challenge/${challenge._id}/edit`} className="rounded-xl border border-[#22c55e]/50 text-[#22c55e] px-4 py-2 text-sm font-black">تعديل</Link>}
        {owned && <button onClick={copyLink} disabled={!activeInvite} className="rounded-xl bg-[#22c55e] text-slate-950 px-4 py-2 text-sm font-black disabled:opacity-50">{copied ? 'تم النسخ' : 'نسخ رابط الدعوة'}</button>}
        {owned && <button onClick={() => rotateInvite.mutate(challenge._id)} className="rounded-xl border border-amber-500/40 text-amber-300 px-4 py-2 text-sm font-black">تغيير الكود</button>}
        {owned && Number(challenge.participantCount || 0) === 0 && <button onClick={remove} className="rounded-xl border border-red-500/40 text-red-300 px-4 py-2 text-sm font-black">حذف</button>}
      </div>
    </article>
  );
};

const PrivateChallengesPage = () => {
  const { data, isLoading, isError } = useMyChallenges();
  const owned = data?.owned || [];
  const joined = data?.joined || [];

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-4 py-10" dir="rtl">
        <header className="flex flex-col sm:flex-row justify-between gap-5 sm:items-center mb-10">
          <div>
            <p className="text-violet-300 font-black text-sm">PRIVATE CHALLENGES</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white">تحدياتي الخاصة</h1>
            <p className="mt-2 text-gray-400">أنشئ تحديك وشارك رابط دعوة خاصًا مع أصدقائك.</p>
          </div>
          <Link to="/private-challenge/new" className="text-center rounded-2xl bg-[#22c55e] text-slate-950 px-6 py-4 font-black">+ إنشاء تحدٍ خاص</Link>
        </header>

        {isLoading && <div className="py-20 text-center text-gray-400">جارٍ تحميل تحدياتك...</div>}
        {isError && <div className="py-12 text-center text-red-300">تعذر تحميل التحديات الخاصة.</div>}
        {!isLoading && !isError && (
          <div className="space-y-12">
            <section>
              <h2 className="mb-4 text-xl font-black text-white">تحديات أنشأتها ({owned.length})</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {owned.map((challenge) => <ChallengeRow key={challenge._id} challenge={challenge} owned />)}
              </div>
              {!owned.length && <p className="rounded-2xl border border-dashed border-slate-700 text-gray-500 p-8 text-center">لم تنشئ تحديًا خاصًا بعد.</p>}
            </section>
            <section>
              <h2 className="mb-4 text-xl font-black text-white">تحديات انضممت إليها ({joined.length})</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {joined.map((challenge) => <ChallengeRow key={challenge._id} challenge={challenge} />)}
              </div>
              {!joined.length && <p className="rounded-2xl border border-dashed border-slate-700 text-gray-500 p-8 text-center">استخدم رابط دعوة للانضمام إلى تحدٍ خاص.</p>}
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
};

export default PrivateChallengesPage;
