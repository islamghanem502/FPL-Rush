import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { fmt } from '@/lib/format';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useChallenge, useCreatePrivate, useUpdateChallenge } from '@/hooks/useChallenges';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card, Divider } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Field';
import { NameStrip } from '@/components/ui/NameStrip';
import { Empty, Loading } from '@/components/ui/Misc';
import { ChallengeForm, Steps } from '@/components/challenge/ChallengeForm';
import { InviteBox } from '@/components/challenge/InviteBox';
import { OwnerMode } from '@/components/challenge/OwnerMode';

// 10c — the challenge exists; hand over the link and let the owner opt in.
function Ready({ created, me, onAgain }) {
  const { data: challenge } = useChallenge(created._id);
  const live = challenge || created;
  return (
    <>
      <Chrome back="/challenges" title="تحدي خاص">
        <Chip variant="live">تم الإنشاء</Chip>
        <div className="mt-3 text-[28px] font-black leading-tight">تحديك جاهز</div>
        <div className="mt-1.5 text-[14px] font-semibold opacity-80">ابعت الرابط للشلة — كل واحد يدخل بحسابه في FPL.</div>
      </Chrome>
      <Page>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[19px] font-black">{live.title}</div>
              <div className="text-[12.5px] font-semibold text-muted">خاص · بالرابط فقط</div>
            </div>
            <div className="shrink-0 rounded-panel bg-ink px-3 py-1.5 text-center">
              <div className="num text-[10px] tracking-[.1em] text-canvas">GW</div>
              <div className="num text-[15px] leading-none text-brand">{live.startEvent}—{live.endEvent}</div>
            </div>
          </div>
          <Divider />
          <InviteBox challenge={live} invite={created} primary />
        </Card>

        <Card className="mt-3">
          <div className="text-[14.5px] font-black">{live.ownerParticipation === 'participant' ? 'أنت أول المشاركين' : 'أنت تراقب التحدي'}</div>
          {live.ownerParticipation === 'participant' ? (
            <NameStrip className="mt-3" rank={1} user={me} name={me?.teamName || me?.managerName} reason="في انتظار انضمام باقي المشاركين" value={0} />
          ) : (
            <p className="mt-1 text-[12.5px] font-semibold text-muted">اسمك لن يظهر في الترتيب إلا لو اخترت المشاركة.</p>
          )}
          <div className="mt-4"><OwnerMode challenge={live} /></div>
          <Notice className="mt-3.5">يبدأ الحساب مع انطلاق GW {live.startEvent} — النقاط قبلها لا تُحسب.</Notice>
        </Card>

        <div className="mt-5">
          <Button variant="secondary" size="lg" full to={`/challenge/${live._id}`}>فتح صفحة التحدي</Button>
          <Button variant="tertiary" full className="mt-2" onClick={onAgain}>إنشاء تحدي آخر</Button>
        </div>
      </Page>
    </>
  );
}

export default function CreateChallenge() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const existing = useChallenge(id);
  const create = useCreatePrivate();
  const update = useUpdateChallenge();
  const [step, setStep] = useState(1);
  const [created, setCreated] = useState(null);

  const currentGw = Math.min(38, Math.max(1, Number(gw || me?.currentEvent || 1)));

  if (created) return <Ready created={created} me={me} onAgain={() => { setCreated(null); setStep(1); }} />;

  if (editing && existing.isPending) return <><Chrome back title="تعديل التحدي" /><Loading /></>;
  if (editing && (!existing.data || !existing.data.isOwner)) {
    return (
      <>
        <Chrome back="/challenges" title="تعديل التحدي" />
        <Page><Empty number="403" title="لا يمكنك تعديل هذا التحدي" action={<Button variant="secondary" to="/challenges">كل التحديات</Button>} /></Page>
      </>
    );
  }

  const submit = (payload) => {
    const done = {
      onError: (e) => toast.error(errorMessage(e)),
    };
    if (editing) {
      update.mutate({ id, payload }, { ...done, onSuccess: () => { toast.success('تم حفظ التعديلات'); navigate(`/challenge/${id}`); } });
    } else {
      create.mutate(payload, { ...done, onSuccess: ({ data }) => { setCreated(data); window.scrollTo({ top: 0 }); } });
    }
  };

  const minStart = editing ? Math.min(existing.data.startEvent, currentGw) : currentGw;

  return (
    <>
      <Chrome back="/challenges" title={editing ? 'تعديل التحدي' : 'تحدي خاص'}>
        <Steps step={step} />
        <div className="mt-2.5 text-[12px] font-semibold opacity-70">
          {editing ? 'التعديل متاح قبل بداية التحدي وقبل انضمام أي مشارك.' : 'دقيقة واحدة وتحديك جاهز. كل ما بعد الخطوة 1 اختياري.'}
        </div>
      </Chrome>
      <Page>
        <ChallengeForm
          key={editing ? id : 'new'}
          initial={editing ? existing.data : undefined}
          minStartEvent={minStart}
          currentGw={gw}
          visibility="private"
          step={step}
          onStep={setStep}
          onSubmit={submit}
          saving={create.isPending || update.isPending}
          submitLabel={editing ? 'حفظ التعديلات' : 'إنشاء التحدي'}
        />
        {!editing && step === 1 && (
          <p className="mt-6 text-center text-[12.5px] font-semibold text-muted">
            عايز تحدي عام يظهر لكل مستخدمي FPL Rush؟{' '}
            <Link to="/public-challenge" className="font-black text-ink">اعرف التفاصيل</Link>
          </p>
        )}
        {editing && (
          <p className="mt-6 text-center text-[12.5px] font-semibold text-muted">{fmt(existing.data.participantCount || 0)} مشارك حتى الآن</p>
        )}
      </Page>
    </>
  );
}
