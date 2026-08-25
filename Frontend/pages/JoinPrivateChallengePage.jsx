import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useEnrollWithPrivateInvite, usePrivateInvite } from '../hooks/useAuthQuery';

const JoinPrivateChallengePage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { data: challenge, isLoading, error } = usePrivateInvite(inviteCode);
  const joinMutation = useEnrollWithPrivateInvite();

  const join = () => {
    joinMutation.mutate(inviteCode, {
      onSuccess: (response) => navigate(`/challenge/${response.data.challengeId}`, { replace: true }),
      onError: (requestError) => alert(requestError.response?.data?.message || 'تعذر الانضمام إلى التحدي')
    });
  };

  if (isLoading) return <Layout><div className="min-h-[60vh] flex justify-center items-center text-white">جارٍ فحص رابط الدعوة...</div></Layout>;
  if (error || !challenge) return <Layout><div className="min-h-[60vh] flex justify-center items-center text-red-300">رابط الدعوة غير صالح أو لم يعد متاحًا.</div></Layout>;

  return (
    <Layout>
      <main className="max-w-xl mx-auto px-4 py-14" dir="rtl">
        <section className="bg-slate-900/70 border border-violet-400/40 rounded-3xl p-7 sm:p-9 text-right shadow-2xl">
          <span className="text-xs font-black bg-violet-500/20 text-violet-200 border border-violet-400/30 rounded-full px-3 py-1">دعوة خاصة</span>
          <h1 className="mt-4 text-3xl font-black text-white">{challenge.title}</h1>
          <p className="mt-3 text-gray-300 leading-relaxed whitespace-pre-line">{challenge.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-gray-400">الجولات</p><b className="text-[#22c55e]">{challenge.startEvent} – {challenge.endEvent}</b></div>
            <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-gray-400">المشاركون</p><b className="text-white">{challenge.participantCount || 0}</b></div>
          </div>
          {challenge.isJoined ? (
            <button onClick={() => navigate(`/challenge/${challenge._id}`)} className="mt-7 w-full rounded-xl bg-[#22c55e] text-slate-950 font-black py-4">أنت منضم بالفعل — فتح التحدي</button>
          ) : (
            <button disabled={!challenge.canJoin || joinMutation.isPending} onClick={join} className="mt-7 w-full rounded-xl bg-[#22c55e] text-slate-950 font-black py-4 disabled:opacity-50">
              {joinMutation.isPending ? 'جارٍ الانضمام...' : challenge.canJoin ? 'الانضمام إلى التحدي' : 'لا تطابق شروط الانضمام'}
            </button>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default JoinPrivateChallengePage;
