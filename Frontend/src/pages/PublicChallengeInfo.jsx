import { lazy, Suspense } from 'react';
import { useCurrentGw } from '@/hooks/useBonus';
import { CHALLENGE, aspect } from '@/motion/scenes/specs';
import { AppPage } from '@/components/layout/AppPage';
import { Button, TextLink } from '@/components/kit/Button';
import { Notice } from '@/components/kit/Feedback';
import { PageTitle } from '@/components/kit/Heading';
import { Panel } from '@/components/kit/Panel';
import { ChatIcon, CheckIcon } from '@/components/kit/icons';

// The landing's own scene, in public mode — what a public challenge looks like.
const ChallengePreview = lazy(() => import('@/components/landing/ChallengePreview'));

const WHATSAPP = import.meta.env.VITE_PUBLIC_CHALLENGE_WHATSAPP || 'https://wa.me/201094474067';
const MESSAGE = encodeURIComponent('مرحباً، أريد إنشاء تحدٍ عام على FPL Rush. أرجو التواصل معي لمعرفة التفاصيل.');

const POINTS = [
  ['ظهور لكل المستخدمين', 'التحدي بيظهر في صفحة التحديات، ويدخله أي حد فريقه مطابق للشروط.'],
  ['تنظيم ودعم', 'بنظبط معاك القواعد والجولات والترتيب وقفل التحدي بشكل موثوق.'],
  ['جوائز وخطة نشر', 'بنتفق على الجوائز وطريقة الإعلان قبل النشر.'],
];

// Public challenges are set up with us, not from a form.
export default function PublicChallengeInfo() {
  const { data: gw } = useCurrentGw();
  const startGw = Number(gw) || 1;

  return (
    <AppPage back="/challenges">
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div className="flex flex-col gap-7">
          <PageTitle
            kicker="للجروبات الكبيرة والبراندات وصناع المحتوى"
            title="تحدي يوصل لكل لاعبي FPL Rush"
            sub="التحدي العام بيظهر لكل مستخدمي المنصة. بنرتّب التفاصيل معاك قبل النشر."
          />
          <ul className="flex flex-col gap-4">
            {POINTS.map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-edge bg-pitch text-edge">
                  <CheckIcon size={14} strokeWidth={3.2} />
                </span>
                <div>
                  <div className="font-display text-[16px] font-bold">{title}</div>
                  <p className="mt-0.5 text-[14px] leading-[1.75] text-white/60">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <Notice>الأسعار والدفع هيتضافوا قريب — دلوقتي بنتواصل معاك مباشرة ونجهّز التحدي سوا.</Notice>
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Button size="lg" knob full href={`${WHATSAPP}${WHATSAPP.includes('?') ? '&' : '?'}text=${MESSAGE}`} className="md:w-auto">
              <ChatIcon size={18} />
              كلّمنا على واتساب
            </Button>
            <TextLink to="/challenges/new">أو اعمل تحدي خاص دلوقتي</TextLink>
          </div>
        </div>

        <Panel className="-mx-1 p-2.5 md:mx-0 md:p-5">
          <div className="rounded-[18px] border-2 border-edge bg-night p-2.5 md:p-5">
            <div style={{ aspectRatio: aspect(CHALLENGE) }} aria-hidden>
              <Suspense fallback={null}>
                <ChallengePreview mode="public" startGw={startGw} length={Math.min(4, 38 - startGw + 1)} prizes />
              </Suspense>
            </div>
          </div>
        </Panel>
      </div>
    </AppPage>
  );
}
