import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useChallenge, useCreatePrivate, useUpdateChallenge } from '@/hooks/useChallenges';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { confetti } from '@/motion/confetti';
import { AppPage } from '@/components/layout/AppPage';
import { Avatar } from '@/components/kit/Avatar';
import { Button, TextLink } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Empty, Notice, PageLoader } from '@/components/kit/Feedback';
import { PageTitle } from '@/components/kit/Heading';
import { Panel } from '@/components/kit/Panel';
import { Steps } from '@/components/kit/Steps';
import { LockIcon } from '@/components/kit/icons';
import { TornTicket } from '@/components/art/TornTicket';
import { ChallengeForm, FORM_STEPS } from '@/components/challenge/ChallengeForm';
import { InviteBox } from '@/components/challenge/InviteBox';
import { OwnerMode } from '@/components/challenge/OwnerMode';
import { Ticket } from '@/components/challenge/Parts';

// The challenge exists: hand over the ticket, the link, and let the owner opt in.
function Ready({ created, me, onAgain }) {
  const { data: challenge } = useChallenge(created._id);
  const live = challenge || created;
  const stage = useRef(null);
  const playing = live.ownerParticipation === 'participant';

  // The ticket drops in with a little swing, then one burst of confetti.
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.timeline({ delay: 0.2 })
          .from('.js-ticket', { y: -60, rotate: -6, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)' })
          .call(() => confetti(stage.current, { origin: 0.45 }));
      });
    },
    { scope: stage },
  );

  return (
    <AppPage back="/challenges" narrow>
      <PageTitle kicker="تم الإنشاء" title="تحديك جاهز" sub="ابعت الرابط للشلة — كل واحد يدخل بفريقه في الفانتازي." />

      <div ref={stage} className="relative">
        <Ticket
          className="js-ticket"
          stubHeight={76}
          stub={
            <div className="flex w-full items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-bold text-edge/70">
                <LockIcon size={14} />
                خاص · بالرابط بس
              </span>
              <span dir="ltr" className="font-display text-[20px] font-extrabold tracking-[.14em]">{created.inviteCode}</span>
            </div>
          }
        >
          <div className="flex items-center gap-4 p-5 pb-6 md:p-6">
            <Crest src={live.image} title={live.title} size={60} />
            <div className="min-w-0">
              <div className="font-display text-[12.5px] font-semibold text-edge/65">دعوة لتحدي</div>
              <div className="truncate font-display text-[24px] font-extrabold leading-tight md:text-[28px]">{live.title}</div>
              <div dir="ltr" className="mt-1 text-right font-display text-[14px] font-bold text-edge/70">{gwRange(live.startEvent, live.endEvent)}</div>
            </div>
          </div>
        </Ticket>
      </div>

      <Panel>
        <InviteBox challenge={live} invite={created} primary />
      </Panel>

      <Panel className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-[17px] font-bold">{playing ? 'أنت أول المشاركين' : 'أنت بتتفرج على التحدي'}</h2>
          {playing ? (
            <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-pitch px-3 py-3 text-edge">
              <span className="w-6 text-center font-display text-[18px] font-extrabold">1</span>
              <Avatar user={me} size={38} light />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[15px] font-bold">{me?.teamName || me?.managerName}</div>
                <div className="truncate text-[12.5px] text-edge/70">في انتظار انضمام باقي المشاركين</div>
              </div>
              <span className="font-display text-[20px] font-extrabold tabular-nums">0</span>
            </div>
          ) : (
            <p className="mt-1.5 text-[13.5px] leading-[1.75] text-white/55">اسمك مش هيظهر في الترتيب غير لو اخترت تشارك.</p>
          )}
        </div>
        <OwnerMode challenge={live} />
        <Notice>الحساب يبدأ مع انطلاق GW {live.startEvent} — النقاط قبلها مش بتتحسب.</Notice>
      </Panel>

      <div className="flex flex-col items-center gap-4">
        <Button variant="secondary" size="lg" knob full to={`/challenge/${live._id}`}>افتح صفحة التحدي</Button>
        <TextLink onClick={onAgain}>اعمل تحدي تاني</TextLink>
      </div>
    </AppPage>
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

  if (editing && existing.isPending) return <AppPage back narrow><PageLoader /></AppPage>;
  if (editing && (!existing.data || !existing.data.isOwner)) {
    return (
      <AppPage back="/challenges" narrow>
        <Empty art={<TornTicket />} title="مينفعش تعدّل التحدي ده" action={<Button variant="secondary" to="/challenges">كل التحديات</Button>} />
      </AppPage>
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
    <AppPage back="/challenges" narrow stepKey={step}>
      <div className="flex flex-col gap-6">
        <PageTitle
          kicker={editing ? existing.data.title : 'تحدي خاص'}
          title={editing ? 'عدّل تحديك' : step === 1 ? 'اعمل تحدي لأصحابك' : 'الجوائز والشروط'}
          sub={
            editing
              ? 'التعديل متاح قبل بداية التحدي وقبل ما حد ينضم.'
              : step === 1 ? 'دقيقة واحدة وتحديك جاهز. كل اللي بعد الخطوة دي اختياري.' : 'كله اختياري — تقدر تنشئ التحدي من غيره.'
          }
        />
        <Steps steps={FORM_STEPS} current={step} />
      </div>

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
        submitLabel={editing ? 'احفظ التعديلات' : 'أنشئ التحدي'}
      />

      {!editing && step === 1 && (
        <p className="text-center text-[13.5px] leading-[1.8] text-white/50">
          عايز تحدي عام يظهر لكل مستخدمي FPL Rush؟{' '}
          <TextLink to="/public-challenge" className="text-[13.5px]">اعرف التفاصيل</TextLink>
        </p>
      )}
      {editing && (
        <p className="text-center text-[13.5px] text-white/50">{fmt(existing.data.participantCount || 0)} مشارك لحد دلوقتي</p>
      )}
    </AppPage>
  );
}
