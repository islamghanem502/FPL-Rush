import { lazy, Suspense, useState } from 'react';
import { gameweeks } from '@/lib/format';
import { Panel } from '@/components/kit/Panel';
import { Button, IconButton } from '@/components/kit/Button';
import { Segmented } from '@/components/kit/Segmented';
import { Slider } from '@/components/kit/Slider';
import { Toggle } from '@/components/kit/Toggle';
import { SendIcon } from '@/components/kit/icons';
import { CHALLENGE, aspect } from '@/motion/scenes/specs';

const ChallengePreview = lazy(() => import('./ChallengePreview'));

const LAST_GW = 38;
const MAX_LENGTH = 10;

export const MODES = [
  { value: 'public', label: 'تحديات عامة' },
  { value: 'private', label: 'تحدي لأصحابك' },
];

const ABOUT = {
  public: 'تحديات مفتوحة لكل مستخدمي المنصة، بجولات وشروط دخول وجوائز معلنة من البداية. لو فريقك مطابق للشروط، ادخل ونافس الكل.',
  private: 'اعمل تحدي بالمدة والجوائز اللي تختارها، وابعت رابط الدعوة للشلة. الترتيب بيتحدّث مع كل جولة لحد ما يبان البطل.',
};

// Mirrors what a public challenge really checks (see lib/challenge eligibility)
const PUBLIC_FACTS = [
  'بيظهر لكل المستخدمين، وتدخله بضغطة',
  'شروط دخول واضحة: نقاطك، ترتيبك العام، وبدايتك في اللعبة',
  'الجوائز معلنة قبل ما التحدي يبدأ',
];

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-pitch)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

// The two ways to play FPL Rush, one switch between them. The Remotion
// preview follows the mode; the controls under it are the real knobs of each.
export function PlayModes({ gw, mode, onMode }) {
  const startGw = Number(gw) || 1;
  const maxLength = Math.max(1, Math.min(MAX_LENGTH, LAST_GW - startGw + 1));
  const [length, setLength] = useState(Math.min(4, maxLength));
  const [prizes, setPrizes] = useState(true);
  const isPrivate = mode === 'private';

  return (
    <div className="grid items-start gap-8 md:grid-cols-[1fr_1.15fr] md:gap-14">
      <div className="js-reveal md:sticky md:top-28">
        <h2 className="font-display text-[26px] font-extrabold leading-[1.25] md:text-[46px]">طريقتين تلعب بيهم</h2>
        <p className="mt-3 max-w-[440px] text-[15px] leading-[1.8] text-white/65 md:text-[16px]">
          كل تحدي مربوط بفريقك الحقيقي في الفانتازي — النقاط بتتحسب من اللعبة نفسها.
        </p>
        <Segmented label="نوع التحدي" options={MODES} value={mode} onChange={onMode} className="mt-7 max-w-[400px]" />
        <p key={mode} className="mt-5 max-w-[440px] animate-fadein text-[15px] leading-[1.8] text-white/85 md:text-[16px]">
          {ABOUT[mode]}
        </p>
      </div>

      <Panel className="js-reveal -mx-1 p-2.5 md:mx-0 md:p-6">
        <div className="rounded-[18px] border-2 border-edge bg-night p-2.5 md:p-6">
          <div style={{ aspectRatio: aspect(CHALLENGE) }} aria-hidden>
            <Suspense fallback={null}>
              <ChallengePreview mode={mode} startGw={startGw} length={isPrivate ? length : Math.min(4, maxLength)} prizes={isPrivate ? prizes : true} />
            </Suspense>
          </div>
        </div>

        {isPrivate ? (
          <div className="mt-5 grid gap-5 px-2 pb-2 md:px-1 md:pb-0">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="demo-length" className="font-display text-[15px] font-semibold">مدة التحدي</label>
                <span className="font-display text-[14px] font-bold text-pitch">{gameweeks(length)}</span>
              </div>
              <Slider id="demo-length" className="mt-2" value={length} min={1} max={maxLength} onChange={setLength} aria-valuetext={gameweeks(length)} />
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="demo-prizes" className="cursor-pointer">
                <span className="block font-display text-[15px] font-semibold">جوائز للمراكز الأولى</span>
                <span className="mt-0.5 block text-[13px] text-white/55">الأول والثاني والثالث — أنت تحدد الجائزة</span>
              </label>
              <Toggle id="demo-prizes" checked={prizes} onChange={setPrizes} />
            </div>

            <div>
              <div className="font-display text-[15px] font-semibold">ابعت الدعوة لأصحابك</div>
              <div className="mt-2 flex items-center gap-2 rounded-full bg-night-3 p-1.5 ps-4 ring-1 ring-white/[.06]">
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-white/45">رابط الدعوة بيظهر هنا بعد ما تنشئ التحدي</span>
                <IconButton to="/register" label="أنشئ تحديك" size={42}>
                  <SendIcon size={19} />
                </IconButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 px-2 pb-2 md:px-1 md:pb-0">
            <ul className="grid gap-3">
              {PUBLIC_FACTS.map((fact) => (
                <li key={fact} className="flex gap-2.5 text-[14.5px] leading-relaxed text-white/80">
                  <Check />
                  {fact}
                </li>
              ))}
            </ul>
            <Button knob full to="/register" className="mt-6">سجّل وادخل تحدي عام</Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
