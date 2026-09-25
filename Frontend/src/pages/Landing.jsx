import { Link } from 'react-router-dom';
import { useCurrentGw } from '@/hooks/useBonus';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Chip, LiveChip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { BonusButton } from '@/components/ui/Misc';

const FEATURES = [
  ['منافسة بالمهارة فقط', 'لا اشتراكات ولا حظ — نقاط فريقك في FPL هي كل شيء.'],
  ['تحديات بجولات محددة', 'كل تحدي يبدأ وينتهي في جولات معلومة، والنقاط تُحسب من البداية للنهاية.'],
  ['ترتيب مباشر', 'شوف مكانك بين المشاركين لحظة بلحظة، وجوائز حقيقية للأوائل.'],
];

export default function Landing() {
  const { data: gw } = useCurrentGw();

  return (
    <>
      <Chrome />
      <Page className="pt-5">
        {/* Current gameweek */}
        <Card className="flex items-center gap-3 py-3">
          <div className="shrink-0 rounded-[14px] bg-ink px-3 py-2 text-center">
            <div className="num text-[10px] tracking-[.14em] text-canvas">GW</div>
            <div className="num-display text-[26px] leading-[.95] text-brand">{gw ? String(gw).padStart(2, '0') : '—'}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold text-muted">الجولة الحالية في الفانتازي</div>
            <div className="text-[15px] font-black">التحديات مفتوحة الآن</div>
          </div>
          <LiveChip>LIVE</LiveChip>
        </Card>

        {/* Hero */}
        <h1 className="mt-7 text-[37px] font-black leading-[1.25]">
          جمعت كام <span className="rounded-panel bg-brand px-2 py-0.5">نقطة ؟</span>
        </h1>

        {/* Phone on the left, a hand-written note on the right, a looping
            arrow from the note to the phone. */}
        <div className="relative mt-2">
          <img
            src="/landing.png"
            alt="FPL Rush على الهاتف"
            className="relative -ml-3 mr-auto block w-[66%] max-w-[300px]"
            style={{ filter: 'drop-shadow(0 16px 30px rgba(26,26,26,.2))' }}
          />
          <div className="absolute right-0 top-3 flex w-[46%] flex-col items-end">
            <p className="hand -rotate-3 text-right text-[22px] leading-[1.35] text-ink">
              جاهز تشارك في تحديات تبدأ من <span className="num whitespace-nowrap">GW {gw || '—'}</span>؟
            </p>
            <svg viewBox="0 0 200 170" className="-mt-1 ml-[8%] w-[84%] max-w-[160px]" aria-hidden>
              <path
                d="M158 6 C 176 40, 166 78, 138 84 C 114 89, 106 62, 128 58 C 154 54, 150 100, 112 118 C 92 128, 66 136, 40 142"
                fill="none" stroke="#E8333A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
              />
              <polygon points="22,146 50,128 48,158" fill="#E8333A" />
            </svg>
          </div>
        </div>

        <div className="mt-2">
          <Button size="lg" full to="/register">ابدأ التحدي</Button>
          <Button variant="secondary" size="lg" full className="mt-2.5" to="/login">شوف كل تحديات <span className="num">GW {gw || ''}</span></Button>
        </div>

        {/* Why */}
        <div className="mt-6 grid gap-2.5 md:grid-cols-3">
          {FEATURES.map(([title, body], i) => (
            <Card key={title}>
              <Chip variant="gw">{String(i + 1).padStart(2, '0')}</Chip>
              <h3 className="mt-3 text-[16px] font-black">{title}</h3>
              <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">{body}</p>
            </Card>
          ))}
        </div>

        {/* Bonus tracker — public */}
        <div className="mt-5 flex justify-center">
          <BonusButton />
        </div>

        <p className="mt-6 text-center text-[13px] font-semibold text-muted">
          عندك حساب؟ <Link to="/login" className="font-black text-ink">سجّل دخولك</Link>
          <span className="mx-2">·</span>
          <Link to="/partnership" className="font-black text-ink">للشركاء وصناع المحتوى</Link>
        </p>
      </Page>
      <Footer />
    </>
  );
}
