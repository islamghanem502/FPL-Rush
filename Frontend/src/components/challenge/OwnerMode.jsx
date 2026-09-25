import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { useOwnerParticipation } from '@/hooks/useChallenges';
import { Segmented } from '@/components/ui/Misc';

// The owner of a private challenge watches by default and can opt into the
// standings until the start gameweek has passed.
export function OwnerMode({ challenge, locked = false }) {
  const mutation = useOwnerParticipation();
  const mode = challenge.ownerParticipation || 'observer';

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
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14.5px] font-black">وضعك في التحدي</span>
        <span className="text-[11.5px] font-bold text-muted">{locked ? 'لا يتغيّر بعد البداية' : 'يمكن تغييره قبل البداية'}</span>
      </div>
      <p className="mt-0.5 text-[12.5px] font-semibold text-muted">أنت مراقب افتراضيًا. انضم لجدول الترتيب لو عايز تنافس.</p>
      <Segmented
        className="mt-3"
        value={mode}
        onChange={locked ? () => {} : change}
        options={[
          { value: 'participant', label: 'أشارك في التحدي' },
          { value: 'observer', label: 'أكتفي بالمراقبة' },
        ]}
      />
    </div>
  );
}
