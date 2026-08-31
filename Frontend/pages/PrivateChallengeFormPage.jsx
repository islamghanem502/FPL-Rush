import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ChallengeForm from '../components/ChallengeForm';
import {
  useChallengeDetails,
  useCreatePrivateChallenge,
  usePrivateInviteLink,
  useSetOwnerParticipation,
  useUpdateChallenge,
  useUser,
} from '../hooks/useAuthQuery';

const copy = async (value) => {
  await navigator.clipboard.writeText(value);
};

const PrivateChallengeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: challenge, isLoading } = useChallengeDetails(id);
  const createMutation = useCreatePrivateChallenge();
  const updateMutation = useUpdateChallenge();
  const ownerParticipationMutation = useSetOwnerParticipation();
  const { data: user } = useUser();
  const { data: storedInvite } = usePrivateInviteLink(id, isEdit && Boolean(challenge?.isOwner));
  const [createdInvite, setCreatedInvite] = useState(null);
  const [error, setError] = useState('');

  const initialValue = useMemo(() => challenge || undefined, [challenge]);
  const invite = createdInvite || storedInvite;
  const ownerMode = challenge?.ownerParticipation || createdInvite?.ownerParticipation || 'observer';
  const ownerId = challenge?._id || createdInvite?.id;
  const currentGameweek = Math.min(38, Math.max(1, Number(user?.currentEvent || 1)));

  const submit = (payload) => {
    setError('');
    const callbacks = {
      onSuccess: (response) => {
        const data = response.data;
        if (isEdit) {
          navigate('/my-challenges');
          return;
        }
        setCreatedInvite({ id: data._id, inviteCode: data.inviteCode, inviteUrl: data.inviteUrl, ownerParticipation: data.ownerParticipation || 'observer' });
      },
      onError: (requestError) => setError(requestError.response?.data?.message || 'تعذر حفظ التحدي')
    };
    if (isEdit) updateMutation.mutate({ id, payload }, callbacks);
    else createMutation.mutate(payload, callbacks);
  };

  const changeOwnerMode = (mode) => ownerParticipationMutation.mutate(
    { id: ownerId, mode },
    {
      onSuccess: (response) => {
        const nextMode = response.data?.ownerParticipation || mode;
        setCreatedInvite((previous) => previous ? { ...previous, ownerParticipation: nextMode } : previous);
      },
      onError: (requestError) => alert(requestError.response?.data?.message || 'تعذر تغيير وضع المالك')
    }
  );

  if (isEdit && isLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center text-white">جارٍ تحميل التحدي...</div></Layout>;
  }

  if (isEdit && !isLoading && (!challenge || !challenge.isOwner)) {
    return <Layout><div className="max-w-xl mx-auto p-10 text-center text-white">التحدي غير موجود أو لا تملك صلاحية تعديله.</div></Layout>;
  }

  return (
    <Layout>
      <main className="max-w-3xl mx-auto px-4 py-10" dir="rtl">
        <Link to="/my-challenges" className="text-sm font-bold text-gray-400 hover:text-[#22c55e]">← رجوع إلى تحدياتي</Link>
        <section className="mt-5 bg-slate-900/70 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <p className="text-[#22c55e] font-black text-sm">PRIVATE CHALLENGE</p>
          <h1 className="text-3xl font-black text-white mt-1 mb-2">{isEdit ? 'تعديل التحدي الخاص' : 'إنشاء تحدٍ خاص'}</h1>
          <p className="text-gray-400 text-sm mb-8">لن يظهر هذا التحدي للعامة. بعد الحفظ ستحصل على رابط وكود لمشاركته مع من تريد.</p>
          {error && <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 p-3 text-sm font-bold">{error}</div>}
          <ChallengeForm currentGameweek={currentGameweek} initialValue={initialValue} onSubmit={submit} isSaving={createMutation.isPending || updateMutation.isPending} submitLabel={isEdit ? 'حفظ التعديلات' : 'إنشاء التحدي والرابط'} />
        </section>

        {invite && (
          <section className="mt-6 bg-[#22c55e]/10 border border-[#22c55e]/40 rounded-3xl p-6 text-right">
            <h2 className="text-xl font-black text-white">تم إنشاء رابط الدعوة</h2>
            <p className="text-gray-300 text-sm mt-2">شارك الرابط أو الكود مع المشاركين. لن يظهر التحدي في القوائم العامة.</p>
            <div className="mt-4 p-3 bg-slate-950/70 rounded-xl font-black text-[#22c55e] text-center break-all" dir="ltr">{window.location.origin}{invite.inviteUrl}</div>
            <div className="mt-3 text-center text-white font-black tracking-widest" dir="ltr">{invite.inviteCode}</div>
            <button onClick={() => copy(`${window.location.origin}${invite.inviteUrl}`)} className="mt-4 w-full rounded-xl bg-[#22c55e] text-slate-950 font-black py-3">نسخ رابط الدعوة</button>
            <div className="mt-6 border-t border-[#22c55e]/20 pt-5">
              <h3 className="font-black text-white">ما وضعك في التحدي؟</h3>
              <p className="mt-1 text-xs leading-5 text-gray-300">أنت مراقب افتراضيًا. يمكنك الانضمام إلى جدول الترتيب والمنافسة إذا أردت.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  disabled={ownerParticipationMutation.isPending || ownerMode === 'participant' || !ownerId}
                  onClick={() => changeOwnerMode('participant')}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
                >
                  {ownerMode === 'participant' ? 'أنت مشارك' : 'أشارك في التحدي'}
                </button>
                <button
                  disabled={ownerParticipationMutation.isPending || ownerMode !== 'participant' || !ownerId}
                  onClick={() => changeOwnerMode('observer')}
                  className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-black text-gray-200 disabled:opacity-50"
                >
                  أكتفي بالمراقبة
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
};

export default PrivateChallengeFormPage;
