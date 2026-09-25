import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { inviteUrl } from '@/lib/challenge';
import { useRotateInvite } from '@/hooks/useChallenges';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Card';

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  } catch {
    toast.error('تعذر النسخ — انسخه يدويًا');
  }
};

// Link + code for a private challenge. `primary` makes "copy" the screen's
// primary button (the success screen); elsewhere it's secondary.
export function InviteBox({ challenge, invite, primary = false }) {
  const rotate = useRotateInvite();
  const [rotated, setRotated] = useState(null);
  const active = rotated || invite;
  const url = inviteUrl(active);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`انضم لتحدي «${challenge.title}» على FPL Rush:\n${url}`)}`;

  const changeCode = () =>
    rotate.mutate(challenge._id, {
      onSuccess: ({ data }) => { setRotated(data); toast.success('تم إنشاء كود جديد — الرابط القديم لم يعد يعمل'); },
      onError: (e) => toast.error(errorMessage(e)),
    });

  if (!active) return <p className="text-[12.5px] font-semibold text-muted">جارٍ تجهيز رابط الدعوة…</p>;

  return (
    <div>
      <div className="text-[12.5px] font-black">رابط الدعوة</div>
      <div className="mono mt-2 truncate rounded-chip bg-canvas px-4 py-3.5 text-[13px]" dir="ltr">{url.replace(/^https?:\/\//, '')}</div>
      <Button variant={primary ? 'primary' : 'secondary'} size="lg" full className="mt-2.5" onClick={() => copyText(url)}>نسخ الرابط</Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="secondary" href={whatsapp}>واتساب</Button>
        <Button variant="secondary" loading={rotate.isPending} onClick={changeCode}>تغيير الكود</Button>
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-3 rounded-chip bg-canvas px-3.5 py-3">
        <span className="text-[12.5px] font-bold">أو بالكود</span>
        <button type="button" onClick={() => copyText(active.inviteCode)} className="jersey text-[20px] tracking-[.06em]">{active.inviteCode}</button>
      </div>
      <Divider className="my-3.5" />
      <p className="text-[12px] font-semibold leading-relaxed text-muted">كل من يملك الرابط يستطيع الانضمام بحساب FPL الخاص به. غيّر الكود إذا تسرّب.</p>
    </div>
  );
}
