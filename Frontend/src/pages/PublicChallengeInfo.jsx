import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Field';

const WHATSAPP = import.meta.env.VITE_PUBLIC_CHALLENGE_WHATSAPP || 'https://wa.me/201094474067';
const MESSAGE = encodeURIComponent('مرحباً، أريد إنشاء تحدٍ عام على FPL Rush. أرجو التواصل معي لمعرفة التفاصيل.');

const POINTS = [
  ['ظهور لكل المستخدمين', 'يظهر التحدي في صفحة التحديات ويدخله كل من يطابق الشروط.'],
  ['تنظيم ودعم', 'نضبط معك القواعد والجولات والترتيب وإغلاق التحدي بشكل موثوق.'],
  ['جوائز وخطة نشر', 'نتفق على الجوائز وطريقة الإعلان قبل النشر.'],
];

// Public challenges are set up with us, not from a form.
export default function PublicChallengeInfo() {
  return (
    <>
      <Chrome back="/challenges" title="تحدي عام">
        <Chip variant="brand">للشركاء وصناع المحتوى</Chip>
        <h1 className="mt-3 text-[26px] font-black leading-tight">تحدي يوصل لكل لاعبي FPL Rush</h1>
        <p className="mt-1.5 text-[13.5px] font-semibold leading-relaxed opacity-80">مناسب للجروبات الكبيرة والبراندات وصناع المحتوى. نرتّب التفاصيل معك قبل النشر.</p>
      </Chrome>
      <Page>
        <div className="grid gap-2.5 md:grid-cols-3">
          {POINTS.map(([title, body], i) => (
            <Card key={title}>
              <Chip variant="gw">{String(i + 1).padStart(2, '0')}</Chip>
              <h2 className="mt-3 text-[15px] font-black">{title}</h2>
              <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">{body}</p>
            </Card>
          ))}
        </div>
        <Notice className="mt-4">الأسعار والدفع يُضافان لاحقًا — حاليًا نتواصل معك مباشرة لتجهيز التحدي.</Notice>
        <Button size="lg" full className="mt-4" href={`${WHATSAPP}${WHATSAPP.includes('?') ? '&' : '?'}text=${MESSAGE}`}>تواصل عبر واتساب</Button>
        <Button variant="tertiary" full className="mt-2" to="/challenges/new">أو أنشئ تحديًا خاصًا الآن</Button>
      </Page>
    </>
  );
}
