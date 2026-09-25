import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { copyText } from '@/components/challenge/InviteBox';

const EMAIL = 'fplrush.official@gmail.com';

const PILLARS = [
  ['تحديات مخصصة', 'تحديات تبدأ وتنتهي في جولات محددة حسب رغبة الشريك، بشروط دخول واضحة.'],
  ['فلترة صارمة', 'لا حسابات وهمية — الدخول بمعايير: الترتيب العام، بداية الحساب، وإجمالي النقاط.'],
  ['تغطية عربية', 'منصة مفتوحة لكل مدربي الوطن العربي، مع نظام جوائز للمسابقات المحلية.'],
];

const PATHS = [
  ['للبراندات', 'اربط اسمك بالإثارة. وفّر جوائزك لمجتمع الفانتازي واحصل على ظهور في جولات الحسم.'],
  ['لصناع المحتوى', 'أنشئ تحديك الخاص لمتابعيك بشروطك. نحن نتولى الحسابات، وأنت تتولى المتعة.'],
];

export default function Partnership() {
  return (
    <>
      <Chrome back="/" title="الشراكات">
        <h1 className="text-[28px] font-black leading-tight">شركاء النجاح</h1>
        <p className="mt-1.5 text-[14px] font-semibold opacity-80">نضع القواعد، وأنت تضع التشكيل.</p>
      </Chrome>
      <Page>
        <div className="grid gap-2.5 md:grid-cols-3">
          {PILLARS.map(([title, body], i) => (
            <Card key={title}>
              <Chip variant="gw">{String(i + 1).padStart(2, '0')}</Chip>
              <h2 className="mt-3 text-[16px] font-black">{title}</h2>
              <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">{body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          {PATHS.map(([title, body]) => (
            <Card key={title} tone="ink">
              <h2 className="text-[17px] font-black text-brand">{title}</h2>
              <p className="mt-1.5 text-[13px] font-semibold leading-relaxed opacity-85">{body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-4 text-center">
          <div className="text-[16px] font-black">جاهز نبدأ؟</div>
          <p className="mt-1 text-[12.5px] font-semibold text-muted">راسلنا وسنرد خلال يوم عمل.</p>
          <div className="mono mt-3 rounded-chip bg-canvas px-4 py-3 text-[13px]">{EMAIL}</div>
          <Button size="lg" full className="mt-3" onClick={() => copyText(EMAIL)}>نسخ البريد الإلكتروني</Button>
        </Card>
      </Page>
      <Footer />
    </>
  );
}
