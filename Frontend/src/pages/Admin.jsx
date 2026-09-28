import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState } from '@/lib/challenge';
import { useMe, useLogout } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useCloseChallenge, useCreatePublic, useDeleteChallenge, usePublicChallenges, useReorderChallenges } from '@/hooks/useChallenges';
import { AppPage } from '@/components/layout/AppPage';
import { Button } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Empty, Skeleton } from '@/components/kit/Feedback';
import { PageTitle } from '@/components/kit/Heading';
import { Panel } from '@/components/kit/Panel';
import { Segmented } from '@/components/kit/Segmented';
import { Steps } from '@/components/kit/Steps';
import { Tag } from '@/components/kit/Tag';
import { ChevronDownIcon, ChevronUpIcon, LogoutIcon, TrashIcon } from '@/components/kit/icons';
import { EmptyNet } from '@/components/art/EmptyNet';
import { ChallengeForm, FORM_STEPS } from '@/components/challenge/ChallengeForm';
import { StateTag } from '@/components/challenge/ChallengeCard';

// Small: swap two neighbours and persist the whole order.
const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const Nudge = ({ label, onClick, disabled, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="press grid size-9 cursor-pointer place-items-center rounded-full border-2 border-edge bg-night-3 text-white"
  >
    {children}
  </button>
);

function PublicList() {
  const { data: gw } = useCurrentGw();
  const { data: challenges = [], isPending } = usePublicChallenges();
  const reorder = useReorderChallenges();
  const close = useCloseChallenge();
  const remove = useDeleteChallenge();
  const fail = (e) => toast.error(errorMessage(e));

  const shift = (index, dir) => {
    const to = index + dir;
    if (to < 0 || to >= challenges.length) return;
    reorder.mutate(move(challenges, index, to).map((c) => c._id), { onError: fail });
  };
  const finalize = (c) => {
    if (!window.confirm(`تثبيت نتائج «${c.title}» الآن؟ يعمل فقط بعد اكتمال الجولة في FPL.`)) return;
    close.mutate(c._id, { onSuccess: ({ data }) => toast.success(data.message), onError: fail });
  };
  const destroy = (c) => {
    if (!window.confirm(`حذف «${c.title}» نهائيًا؟`)) return;
    remove.mutate(c._id, { onSuccess: () => toast.success('تم الحذف'), onError: fail });
  };

  if (isPending) return <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[150px]" />)}</div>;
  if (!challenges.length) return <Empty art={<EmptyNet />} title="مفيش تحديات عامة" hint="أنشئ أول تحدي من التبويب التاني" />;

  return (
    <ol className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
      {challenges.map((c, i) => {
        const state = challengeState(c, gw);
        return (
          <Panel as="li" key={c._id} className="flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <Crest src={c.image} title={c.title} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  <StateTag state={state} startEvent={c.startEvent} />
                  <Tag><span dir="ltr">{gwRange(c.startEvent, c.endEvent)}</span></Tag>
                </div>
                <Link to={`/challenge/${c._id}`} className="mt-2 block truncate font-display text-[17px] font-bold transition-colors hover:text-pitch">{c.title}</Link>
                <div className="mt-0.5 text-[12.5px] text-white/50">{fmt(c.participantCount || 0)} مشارك · ترتيب العرض {i + 1}</div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Nudge label="لفوق" disabled={i === 0 || reorder.isPending} onClick={() => shift(i, -1)}><ChevronUpIcon size={16} /></Nudge>
                <Nudge label="لتحت" disabled={i === challenges.length - 1 || reorder.isPending} onClick={() => shift(i, 1)}><ChevronDownIcon size={16} /></Nudge>
              </div>
            </div>
            {((c.status === 'active' || c.status === 'closing') || (!(c.participantCount > 0) && c.status !== 'finished')) && (
              <div className="flex flex-wrap items-center gap-3 border-t border-white/[.06] pt-4">
                {(c.status === 'active' || c.status === 'closing') && (
                  <Button variant="secondary" size="sm" loading={close.isPending} onClick={() => finalize(c)}>ثبّت النتائج</Button>
                )}
                {!(c.participantCount > 0) && c.status !== 'finished' && (
                  <button
                    type="button"
                    onClick={() => destroy(c)}
                    className="ms-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 font-display text-[13.5px] font-semibold text-white/55 transition-colors hover:bg-white/[.05] hover:text-alert"
                  >
                    <TrashIcon size={15} />
                    احذف
                  </button>
                )}
              </div>
            )}
          </Panel>
        );
      })}
    </ol>
  );
}

function CreatePublic({ onCreated }) {
  const create = useCreatePublic();
  const [step, setStep] = useState(1);
  const submit = (payload) =>
    create.mutate(payload, {
      onSuccess: () => { toast.success('تم نشر التحدي'); onCreated(); },
      onError: (e) => toast.error(errorMessage(e)),
    });
  return (
    <div className="flex flex-col gap-6 md:max-w-[680px]">
      <Steps steps={FORM_STEPS} current={step} />
      <ChallengeForm key={create.isSuccess ? 'done' : 'new'} minStartEvent={1} visibility="public" step={step} onStep={setStep} onSubmit={submit} saving={create.isPending} submitLabel="انشر التحدي" />
    </div>
  );
}

export default function Admin() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');

  return (
    <AppPage
      stepKey={tab}
      end={
        <Button variant="secondary" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogoutIcon size={15} />
          خروج
        </Button>
      }
    >
      <PageTitle
        kicker="لوحة التحكم"
        title={<span dir="auto" className="block truncate text-right">{me?.email?.split('@')[0] || 'Admin'}</span>}
        aside={
          <Segmented
            label="القسم"
            className="w-full md:w-[380px]"
            value={tab}
            onChange={setTab}
            options={[{ value: 'list', label: 'التحديات العامة' }, { value: 'create', label: 'تحدي عام جديد' }]}
          />
        }
      />
      {tab === 'list' ? <PublicList /> : <CreatePublic onCreated={() => setTab('list')} />}
    </AppPage>
  );
}
