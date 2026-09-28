import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { readImage } from '@/lib/image';
import { fmt, fmtCompact, fmtRank } from '@/lib/format';
import { isFplLinked } from '@/lib/challenge';
import { copyText } from '@/lib/clipboard';
import { useFplHistory, useLogout, useMe, useUpdateProfile, useUploadAvatar } from '@/hooks/useAuth';
import { gsap, useGSAP, MOTION_OK } from '@/motion/gsap';
import { AppPage } from '@/components/layout/AppPage';
import { Avatar } from '@/components/kit/Avatar';
import { Button } from '@/components/kit/Button';
import { Skeleton } from '@/components/kit/Feedback';
import { Field, Input } from '@/components/kit/Field';
import { Panel } from '@/components/kit/Panel';
import { Segmented } from '@/components/kit/Segmented';
import { Tag } from '@/components/kit/Tag';
import { CameraIcon, CheckIcon, LogoutIcon, ShareIcon } from '@/components/kit/icons';

const WINDOW = 9;

// The card's outline: a collector's card with a notched top and a shield
// point at the bottom. Drawn in a 300×400 box; the page keeps that ratio.
const CARD =
  'M26 16H106C118 16 126 5 150 5C174 5 182 16 194 16H274Q289 16 289 31V326Q289 343 274 350L166 391Q150 397 134 391L26 350Q11 343 11 326V31Q11 16 26 16Z';

// The manager as a collectible card — what "share" sends, drawn. Mowed pitch,
// black edge, your last gameweek as the big number. Tilts toward the pointer.
function ManagerCard({ me }) {
  const root = useRef(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from(root.current, { rotateY: -70, y: 30, autoAlpha: 0, duration: 1, ease: 'back.out(1.3)', delay: 0.15 });
      });
      gsap.matchMedia().add(`${MOTION_OK} and (hover: hover)`, () => {
        const card = root.current;
        const rx = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' });
        const move = (e) => {
          const box = card.getBoundingClientRect();
          ry(((e.clientX - box.left) / box.width - 0.5) * 16);
          rx(-((e.clientY - box.top) / box.height - 0.5) * 16);
        };
        const leave = () => { rx(0); ry(0); };
        card.addEventListener('pointermove', move);
        card.addEventListener('pointerleave', leave);
        return () => {
          card.removeEventListener('pointermove', move);
          card.removeEventListener('pointerleave', leave);
        };
      });
    },
    { scope: root },
  );

  const stats = [
    ['PTS', fmt(me.totalPoints || 0)],
    ['OVR', me.overallRank ? fmtCompact(me.overallRank) : '—'],
    ['FROM', `GW${me.startedEvent || 1}`],
    ['YRS', fmt(me.yearsActive || 1)],
  ];

  return (
    <div className="w-full [perspective:900px]">
      <div ref={root} className="relative mx-auto aspect-[3/4] w-full max-w-[300px] text-edge [transform-style:preserve-3d]">
        <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-0 size-full drop-shadow-[0_18px_22px_rgba(0,0,0,.4)]" aria-hidden>
          <defs>
            <pattern id="card-mow" width="64" height="400" patternUnits="userSpaceOnUse">
              <rect width="32" height="400" fill="var(--color-pitch)" />
              <rect x="32" width="32" height="400" fill="var(--color-pitch-deep)" />
            </pattern>
          </defs>
          <path d={CARD} fill="url(#card-mow)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="150" cy="150" r="58" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center px-[10%] pb-[17%] pt-[9%]">
          <div className="flex w-full items-start justify-between">
            <div className="text-center leading-none">
              <div dir="ltr" className="font-display text-[44px] font-extrabold tabular-nums">{fmt(me.lastGwPoints || 0)}</div>
              <div dir="ltr" className="mt-1 font-display text-[12px] font-bold">GW{me.currentEvent || ''}</div>
            </div>
            <span className="relative mt-2 block h-[22px] w-[38px] rounded-full border-2 border-edge bg-edge" aria-hidden>
              <span className="knob absolute left-[2px] top-1/2 size-[14px] -translate-y-1/2" />
            </span>
          </div>
          <Avatar user={me} size={96} light className="-mt-3 border-[3px]" />
          <div className="mt-3 w-full truncate text-center font-display text-[21px] font-extrabold leading-tight" dir="auto">
            {me.managerName || me.email?.split('@')[0]}
          </div>
          <div className="my-2.5 h-0.5 w-3/4 rounded-full bg-edge/25" />
          <dl className="grid w-full grid-cols-2 gap-x-5 gap-y-1.5">
            {stats.map(([label, value]) => (
              <div key={label} dir="ltr" className="flex items-baseline justify-center gap-1.5">
                <dd className="font-display text-[17px] font-extrabold tabular-nums">{value}</dd>
                <dt className="font-display text-[11px] font-bold text-edge/65">{label}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-auto w-full truncate text-center font-display text-[12.5px] font-bold text-edge/70" dir="auto">{me.teamName}</div>
        </div>
      </div>
    </div>
  );
}

// Bars, not a charting library: last 9 gameweeks, best in pitch, the current
// one marked in volt, average as a dashed line. Bars grow in on each switch.
function GwChart({ history, currentEvent }) {
  const [mode, setMode] = useState('points');
  const root = useRef(null);
  const rows = useMemo(() => (history?.current || []).slice(-WINDOW), [history]);

  useGSAP(
    () => {
      if (!rows.length) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.js-bar', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.55, stagger: 0.04, ease: 'back.out(1.5)' });
      });
    },
    { scope: root, dependencies: [mode, rows.length], revertOnUpdate: true },
  );

  if (!rows.length) return <p className="py-8 text-center text-[13.5px] text-white/50">لسه مفيش جولات متسجلة الموسم ده.</p>;

  const points = mode === 'points';
  const values = rows.map((r) => (points ? r.points : r.overall_rank));
  const max = Math.max(...values), min = Math.min(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  // Rank: lower is better, so flip it before sizing the bar.
  const size = (v) => (points ? v / (max || 1) : (max - v + (min || 1)) / (max || 1));
  const bestIndex = values.indexOf(points ? max : min);

  return (
    <div ref={root}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-bold">أداء الجولات</h2>
          <div className="mt-0.5 text-[13px] text-white/50">{points ? 'نقاطك' : 'ترتيبك العام'} في آخر {fmt(rows.length)} جولات</div>
        </div>
        <Tag>
          <span dir="ltr">AVG {points ? avg : fmtCompact(avg)}</span>
        </Tag>
      </div>
      <Segmented
        className="mt-4"
        label="نوع الرسم"
        value={mode}
        onChange={setMode}
        options={[{ value: 'points', label: 'النقاط' }, { value: 'rank', label: 'الترتيب العام' }]}
      />

      <div className="relative mt-6">
        {points && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-white/25" style={{ bottom: `calc(${(avg / (max || 1)) * 150}px + 28px)` }} />
        )}
        <div className="flex h-[180px] items-end justify-between gap-1.5 md:gap-2.5">
          {rows.map((row, i) => {
            const best = i === bestIndex;
            const current = Number(row.event) === Number(currentEvent);
            const v = values[i];
            return (
              <div key={row.event} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                {best ? (
                  <span dir="ltr" className="mb-1 font-display text-[11.5px] font-bold text-pitch">{points ? v : fmtCompact(v)}</span>
                ) : current ? (
                  <span className="mb-1.5 block size-2 rounded-full bg-volt" />
                ) : null}
                <div
                  className={cn('js-bar w-full max-w-[34px] rounded-t-[8px]', best ? 'border-2 border-b-0 border-edge bg-pitch' : current ? 'bg-white/40' : 'bg-white/15')}
                  style={{ height: `${Math.max(6, size(v) * 150)}px` }}
                />
                <div dir="ltr" className={cn('mt-2 font-display text-[11px] font-semibold tabular-nums', best || current ? 'text-white' : 'text-white/40')}>{row.event}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-5 text-[12.5px] text-white/60">
        <span className="flex items-center gap-2"><span className="block size-3 rounded-[4px] border-2 border-edge bg-pitch" />أحسن جولة</span>
        <span className="flex items-center gap-2"><span className="block size-2 rounded-full bg-volt" />الجولة الحالية</span>
        {points && <span className="flex items-center gap-2"><span className="block w-4 border-t-2 border-dashed border-white/40" />المتوسط</span>}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const linked = isFplLinked(me);
  const history = useFplHistory(linked);
  const upload = useUploadAvatar();
  const save = useUpdateProfile();
  const logout = useLogout();
  const fileRef = useRef(null);
  const [phone, setPhone] = useState(me?.phone || '');

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readImage(file, { maxSide: 800 });
      upload.mutate(image, { onSuccess: () => toast.success('تم تحديث صورتك'), onError: (err) => toast.error(errorMessage(err)) });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePhone = (e) => {
    e.preventDefault();
    save.mutate({ phone: phone.trim() }, { onSuccess: () => toast.success('تم حفظ رقم الهاتف'), onError: (err) => toast.error(errorMessage(err)) });
  };

  const shareCard = async () => {
    const text = `${me.teamName || 'فريقي'} — ${me.managerName || ''} · الترتيب العام ${fmtRank(me.overallRank)} · ${fmt(me.totalPoints)} نقطة على FPL Rush`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    copyText(text);
  };

  return (
    <AppPage>
      {/* Who you are */}
      <section className="flex items-center gap-4 md:gap-6">
        <div className="relative shrink-0">
          <Avatar user={me} size={96} you className={cn('border-[3px]', upload.isPending && 'opacity-50')} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="غيّر صورتك"
            className="press absolute -bottom-1 -left-1 grid size-10 cursor-pointer place-items-center rounded-full border-2 border-edge bg-pitch text-edge"
          >
            <CameraIcon size={18} strokeWidth={2.4} />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-right font-display text-[26px] font-extrabold leading-tight md:text-[40px]" dir="auto">{me.managerName || me.email?.split('@')[0]}</h1>
          {me.teamName && <div className="mt-0.5 truncate text-right font-display text-[15px] font-semibold text-pitch md:text-[17px]" dir="auto">{me.teamName}</div>}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {me.isVerified ? (
              <Tag tone="pitch" icon={<CheckIcon size={13} strokeWidth={3.2} />}>موثّق</Tag>
            ) : (
              <Tag tone="ghost">{linked ? 'غير موثّق' : 'بدون حساب FPL'}</Tag>
            )}
            {me.fpl_id && <Tag><span dir="ltr">FPL ID {me.fpl_id}</span></Tag>}
            {me.yearsActive > 0 && <Tag>{fmt(me.yearsActive)} {me.yearsActive === 1 ? 'موسم' : 'مواسم'}</Tag>}
            {me.country && <Tag>{me.country}</Tag>}
          </div>
        </div>
      </section>

      {linked ? (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:gap-10">
          <div className="flex flex-col items-center gap-5">
            <ManagerCard me={me} />
            <Button variant="secondary" size="lg" full onClick={shareCard} className="max-w-[300px]">
              <ShareIcon size={17} />
              شارك كارت المدرب
            </Button>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Panel className="grid grid-cols-3 p-0">
              {[
                ['إجمالي النقاط', fmt(me.totalPoints || 0)],
                ['آخر جولة', fmt(me.lastGwPoints || 0)],
                ['الترتيب العام', fmtRank(me.overallRank)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 border-s border-white/[.06] px-2.5 py-4 first:border-s-0 md:px-5">
                  <div className="truncate text-[12px] text-white/50 md:text-[13px]">{label}</div>
                  <div dir="ltr" className="mt-1 truncate text-right font-display text-[16px] font-extrabold tabular-nums md:text-[24px]">{value}</div>
                </div>
              ))}
            </Panel>
            <Panel>
              {history.isPending ? <Skeleton className="h-[300px] bg-night-3" /> : <GwChart history={history.data} currentEvent={me.currentEvent} />}
            </Panel>
            {!me.isVerified && (
              <Panel className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-display text-[16px] font-bold">وثّق عضويتك</div>
                  <div className="mt-0.5 text-[13.5px] text-white/55">انضم لدوري FPL Rush الرسمي عشان تأكد إن الفريق فريقك.</div>
                </div>
                <Button variant="secondary" size="sm" to="/register">وثّق</Button>
              </Panel>
            )}
          </div>
        </div>
      ) : (
        <Button size="lg" knob full to="/register">اربط فريقك من الفانتازي</Button>
      )}

      <Panel as="form" onSubmit={savePhone} className="flex flex-col gap-5 md:max-w-[680px]">
        <div>
          <h2 className="font-display text-[18px] font-bold">بيانات التواصل والتسليم</h2>
          <p className="mt-1 text-[13.5px] leading-[1.75] text-white/55">رقم تليفونك بيُستخدم للتواصل وتسليم الجوائز لو كسبت بس.</p>
        </div>
        <Field id="phone" label="رقم التليفون">
          <Input id="phone" dir="ltr" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className="text-right" />
        </Field>
        <Field id="email" label="البريد الإلكتروني" hint="مربوط بالحساب ومش بيتغيّر">
          <Input id="email" dir="ltr" value={me.email || ''} disabled className="text-right" />
        </Field>
        <Button type="submit" size="lg" full loading={save.isPending} disabled={(me.phone || '') === phone.trim()}>احفظ البيانات</Button>
      </Panel>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => { logout(); navigate('/'); }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 font-display text-[14.5px] font-semibold text-white/55 transition-colors hover:bg-white/[.05] hover:text-alert"
        >
          <LogoutIcon size={17} />
          تسجيل الخروج
        </button>
      </div>
    </AppPage>
  );
}
