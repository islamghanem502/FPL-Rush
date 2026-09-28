import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { inviteUrl } from '@/lib/challenge';
import { copyText } from '@/lib/clipboard';
import { useArmed } from '@/hooks/useArmed';
import { useRotateInvite } from '@/hooks/useChallenges';
import { Button } from '@/components/kit/Button';
import { Loader } from '@/components/kit/Feedback';
import { ChatIcon, CopyIcon, LinkIcon, RefreshIcon } from '@/components/kit/icons';

// Link + code for a private challenge. `primary` makes "copy" the screen's
// pitch button (the success screen); elsewhere it's secondary.
// Changing the code kills the old link, so it asks for a second tap.
export function InviteBox({ challenge, invite, primary = false }) {
  const rotate = useRotateInvite();
  const [rotated, setRotated] = useState(null);
  const [armed, setArmed] = useArmed();
  const active = rotated || invite;
  const url = inviteUrl(active);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`انضم لتحدي «${challenge.title}» على FPL Rush:\n${url}`)}`;

  const changeCode = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    rotate.mutate(challenge._id, {
      onSuccess: ({ data }) => { setRotated(data); toast.success('تم إنشاء كود جديد — الرابط القديم لم يعد يعمل'); },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  if (!active) return <Loader label="جارٍ تجهيز رابط الدعوة…" className="py-6" />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-display text-[14px] font-semibold">رابط الدعوة</div>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-night-3 p-1.5 ps-4 ring-1 ring-white/[.06]">
          <LinkIcon size={16} className="shrink-0 text-white/40" />
          <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-[13.5px] text-white/75">{url.replace(/^https?:\/\//, '')}</span>
          <Button variant={primary ? 'primary' : 'secondary'} size="sm" onClick={() => copyText(url)}>
            <CopyIcon size={15} />
            انسخ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" href={whatsapp}>
          <ChatIcon size={17} />
          واتساب
        </Button>
        <Button variant="secondary" loading={rotate.isPending} onClick={changeCode} className={armed ? 'bg-night! text-alert!' : undefined}>
          <RefreshIcon size={16} />
          {armed ? 'متأكد؟ اضغط تاني' : 'كود جديد'}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white/[.04] px-4 py-3">
        <span className="text-[13px] text-white/55">أو بالكود</span>
        <button
          type="button"
          onClick={() => copyText(active.inviteCode)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 font-display text-[21px] font-extrabold tracking-[.12em] text-pitch transition-colors hover:bg-white/[.06]"
          aria-label="انسخ الكود"
        >
          <span dir="ltr">{active.inviteCode}</span>
          <CopyIcon size={16} className="text-white/40" />
        </button>
      </div>

      <p className="text-[12.5px] leading-[1.8] text-white/50">
        {armed
          ? 'الكود الجديد هيوقف الرابط القديم فورًا — أي حد معاه الرابط القديم مش هيقدر ينضم.'
          : 'أي حد معاه الرابط يقدر ينضم بفريقه في الفانتازي. لو الرابط اتسرّب، اعمل كود جديد.'}
      </p>
    </div>
  );
}
