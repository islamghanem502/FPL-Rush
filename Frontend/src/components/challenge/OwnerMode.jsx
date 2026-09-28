import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { useOwnerParticipation } from '@/hooks/useChallenges';
import { Segmented } from '@/components/kit/Segmented';
import { EyeIcon, LockIcon } from '@/components/kit/icons';

// The owner of a private challenge watches by default and can opt into the
// standings until the start gameweek has passed.
export function OwnerMode({ challenge, locked = false }) {
  const mutation = useOwnerParticipation();
  const mode = challenge.ownerParticipation || 'observer';
  // Slide the switch right away and keep it there while the refetch lands.
  const shown = (mutation.isPending || mutation.isSuccess) && mutation.variables ? mutation.variables.mode : mode;

  const change = (next) => {
    if (next === mode || mutation.isPending) return;
    mutation.mutate(
      { id: challenge._id, mode: next },
      {
        onSuccess: () => toast.success(next === 'participant' ? 'أنت الآن ضمن جدول الترتيب' : 'أنت الآن مراقب'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-[15px] font-bold">وضعك في التحدي</span>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-white/45">
          {locked ? <LockIcon size={13} /> : <EyeIcon size={14} />}
          {locked ? 'لا يتغيّر بعد البداية' : 'تقدر تغيّره قبل البداية'}
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-white/55">أنت مراقب افتراضيًا. انضم لجدول الترتيب لو عايز تنافس.</p>
      <Segmented
        className="mt-3"
        label="وضعك في التحدي"
        value={shown}
        onChange={change}
        disabled={locked}
        options={[
          { value: 'participant', label: 'أشارك' },
          { value: 'observer', label: 'أتفرج بس' },
        ]}
      />
    </div>
  );
}
