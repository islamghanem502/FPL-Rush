import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { fmt, gwRange } from '@/lib/format';
import { challengeState } from '@/lib/challenge';
import { useMe, useLogout } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useCloseChallenge, useCreatePublic, useDeleteChallenge, usePublicChallenges, useReorderChallenges } from '@/hooks/useChallenges';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Empty, Logo, Segmented, Skeleton } from '@/components/ui/Misc';
import { ChallengeForm, Steps } from '@/components/challenge/ChallengeForm';
import { StateChip } from '@/components/challenge/ChallengeCard';

// Small: swap two neighbours and persist the whole order.
const move = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

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

  if (isPending) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px]" />)}</div>;
  if (!challenges.length) return <Empty number="0" title="لا توجد تحديات عامة" hint="أنشئ أول تحدي من التبويب الثاني" />;

  return (
    <div className="space-y-3">
      {challenges.map((c, i) => {
        const state = challengeState(c, gw);
        return (
          <Card key={c._id}>
            <div className="flex items-start gap-3">
              <Logo src={c.image} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  <StateChip state={state} startEvent={c.startEvent} />
                  <Chip variant="gw">{gwRange(c.startEvent, c.endEvent)}</Chip>
                </div>
                <Link to={`/challenge/${c._id}`} className="mt-1.5 block truncate text-[16px] font-black">{c.title}</Link>
                <div className="text-[12px] font-semibold text-muted">{fmt(c.participantCount || 0)} مشارك · ترتيب العرض {i + 1}</div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" disabled={i === 0 || reorder.isPending} onClick={() => shift(i, -1)} className="num h-8 w-8 rounded-panel bg-canvas text-[14px] disabled:opacity-30" aria-label="أعلى">↑</button>
                <button type="button" disabled={i === challenges.length - 1 || reorder.isPending} onClick={() => shift(i, 1)} className="num h-8 w-8 rounded-panel bg-canvas text-[14px] disabled:opacity-30" aria-label="أسفل">↓</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {(c.status === 'active' || c.status === 'closing') && (
                <Button variant="secondary" size="sm" loading={close.isPending} onClick={() => finalize(c)}>تثبيت النتائج</Button>
              )}
              {!(c.participantCount > 0) && c.status !== 'finished' && (
                <Button variant="tertiary" size="sm" onClick={() => destroy(c)}>حذف</Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
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
    <>
      <div className="mb-3 rounded-card bg-ink p-3"><Steps step={step} /></div>
      <ChallengeForm key={create.isSuccess ? 'done' : 'new'} minStartEvent={1} visibility="public" step={step} onStep={setStep} onSubmit={submit} saving={create.isPending} submitLabel="نشر التحدي" />
    </>
  );
}

export default function Admin() {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');

  return (
    <>
      <Chrome right={<Button variant="tertiary" size="sm" dark onClick={() => { logout(); navigate('/'); }}>خروج</Button>}>
        <div className="text-[13px] font-bold opacity-80">لوحة التحكم</div>
        <div className="jersey mt-0.5 text-right text-[30px] leading-tight text-brand">{me?.email?.split('@')[0] || 'ADMIN'}</div>
        <Segmented dark className="mt-4" value={tab} onChange={setTab} options={[{ value: 'list', label: 'التحديات العامة' }, { value: 'create', label: 'إنشاء تحدي عام' }]} />
      </Chrome>
      <Page wide>
        {tab === 'list' ? <PublicList /> : <CreatePublic onCreated={() => setTab('list')} />}
      </Page>
    </>
  );
}
