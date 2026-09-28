import { useState } from 'react';
import { cn } from '@/lib/cn';
import { readImage } from '@/lib/image';
import { fmt, gameweeks, gwRange } from '@/lib/format';
import { Panel } from '@/components/kit/Panel';
import { Button, TextLink } from '@/components/kit/Button';
import { Crest } from '@/components/kit/Crest';
import { Tag } from '@/components/kit/Tag';
import { Toggle } from '@/components/kit/Toggle';
import { Medal } from '@/components/kit/Medal';
import { Notice } from '@/components/kit/Feedback';
import { ChoiceTiles } from '@/components/kit/Choice';
import { GwPicker } from '@/components/kit/GwPicker';
import { Field, Input, Textarea } from '@/components/kit/Field';
import { CameraIcon, PlusIcon, TrashIcon } from '@/components/kit/icons';

const LAST_GW = 38;
const NO_RANK_LIMIT = 10_000_000;
const SUGGESTIONS = ['تحدي الشلة', 'تحدي العمل', 'تحدي العيلة'];
const PRIZES = [
  ['prize', 'المركز الأول', 1],
  ['prizeSecond', 'المركز الثاني', 2],
  ['prizeThird', 'المركز الثالث', 3],
];

// The two steps, for the page's <Steps>.
export const FORM_STEPS = ['الأساسيات', 'الجوائز والشروط'];

const empty = (start) => ({
  title: '',
  description: '',
  descriptionLinks: [],
  prize: '',
  prizeSecond: '',
  prizeThird: '',
  image: '',
  imageData: '',
  backgroundImage: '',
  startEvent: start,
  endEvent: Math.min(LAST_GW, start + 3),
  minTotalPoints: 0,
  maxOverallRank: NO_RANK_LIMIT,
  latestStartedEvent: LAST_GW,
});

const gwList = (from, to) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

// The whole season as 38 cells with the chosen run lit in pitch — so the
// start/length choice reads as a picture, not only as two numbers.
function SeasonRange({ start, end, current }) {
  return (
    <div>
      <div className="flex items-end gap-[3px]" aria-hidden>
        {gwList(1, LAST_GW).map((gw) => {
          const inside = gw >= start && gw <= end;
          return (
            <span
              key={gw}
              className={cn(
                'block min-w-0 flex-1 rounded-full transition-[background-color,height] duration-300',
                inside ? 'h-4 bg-pitch' : 'h-2.5',
                !inside && (current && gw < current ? 'bg-white/[.05]' : 'bg-white/12'),
                gw === Number(current) && !inside && 'bg-volt',
              )}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-display text-[11.5px] font-medium text-white/35" dir="ltr">
        <span>GW 1</span>
        <span>GW 38</span>
      </div>
    </div>
  );
}

const Group = ({ title, aside, children, className }) => (
  <Panel className={cn('flex flex-col gap-4', className)}>
    {(title || aside) && (
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[16px] font-bold md:text-[17px]">{title}</h2>
        {aside}
      </div>
    )}
    {children}
  </Panel>
);

const Optional = () => <span className="text-[12.5px] text-white/40">اختياري</span>;

/**
 * Two steps instead of one long form. Step 1 is enough to create a challenge.
 * `minStartEvent` — earliest allowed start (current GW for private, 1 for admin).
 */
export function ChallengeForm({ initial, minStartEvent = 1, currentGw, visibility = 'private', onSubmit, saving, submitLabel = 'إنشاء التحدي', step, onStep }) {
  const [form, setForm] = useState(() => {
    const base = { ...empty(minStartEvent), ...initial, imageData: '' };
    base.startEvent = Math.min(LAST_GW, Math.max(minStartEvent, Number(base.startEvent) || minStartEvent));
    base.endEvent = Math.min(LAST_GW, Math.max(base.startEvent, Number(base.endEvent) || base.startEvent));
    base.descriptionLinks = (base.descriptionLinks || []).map((l) => ({ label: l?.label || '', url: l?.url || '' }));
    return base;
  });
  const [preview, setPreview] = useState(initial?.image || '');
  const [error, setError] = useState('');
  const [customStart, setCustomStart] = useState(() => form.startEvent > minStartEvent + 2);
  const [customEnd, setCustomEnd] = useState(() => {
    const n = form.endEvent - form.startEvent + 1;
    return !(n === 4 || n === 8 || form.endEvent === LAST_GW);
  });
  const [showRules, setShowRules] = useState(
    () => Boolean(initial && (initial.minTotalPoints > 0 || initial.maxOverallRank < NO_RANK_LIMIT || initial.latestStartedEvent < LAST_GW)),
  );
  const [enabledPrizes, setEnabledPrizes] = useState(() => PRIZES.map(([key]) => key).filter((key) => Boolean(initial?.[key])));
  const togglePrize = (key) => setEnabledPrizes((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setStart = (start) => setForm((f) => ({ ...f, startEvent: start, endEvent: Math.max(start, Math.min(LAST_GW, f.endEvent)) }));
  const setDuration = (n) => set('endEvent', n === 'season' ? LAST_GW : Math.min(LAST_GW, form.startEvent + n - 1));
  const duration = form.endEvent - form.startEvent + 1;

  const pickImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const data = await readImage(file);
      setPreview(data);
      setForm((f) => ({ ...f, image: '', imageData: data }));
    } catch (e) {
      setError(e.message);
    }
    event.target.value = '';
  };

  const links = form.descriptionLinks;
  const setLink = (i, key, value) => set('descriptionLinks', links.map((l, j) => (j === i ? { ...l, [key]: value } : l)));

  const validateStep1 = () => {
    if (!form.title.trim()) return 'اكتب اسم التحدي';
    return '';
  };

  const submit = () => {
    setError('');
    const cleanLinks = links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.label || l.url);
    if (cleanLinks.some((l) => !l.label || !/^https?:\/\//i.test(l.url))) {
      return setError('كل رابط يحتاج اسمًا وعنوانًا يبدأ بـ https://');
    }
    onSubmit({
      ...form,
      title: form.title.trim(),
      descriptionLinks: cleanLinks,
      prize: enabledPrizes.includes('prize') ? form.prize.trim() : '',
      prizeSecond: enabledPrizes.includes('prizeSecond') ? form.prizeSecond.trim() : '',
      prizeThird: enabledPrizes.includes('prizeThird') ? form.prizeThird.trim() : '',
      startEvent: Number(form.startEvent),
      endEvent: Number(form.endEvent),
      minTotalPoints: Number(form.minTotalPoints || 0),
      maxOverallRank: Number(form.maxOverallRank || NO_RANK_LIMIT),
      latestStartedEvent: Number(form.latestStartedEvent || LAST_GW),
    });
  };

  const next = () => {
    const problem = validateStep1();
    if (problem) return setError(problem);
    setError('');
    onStep(2);
    window.scrollTo({ top: 0 });
  };

  // ── Step 1 — basics ──────────────────────────────────────────────────────
  if (step === 1) {
    const starts = gwList(minStartEvent, Math.min(LAST_GW, minStartEvent + 2));
    const startValue = customStart ? 'custom' : form.startEvent;
    const endValue = customEnd ? 'custom' : form.endEvent === LAST_GW ? 'season' : duration === 4 || duration === 8 ? duration : null;

    return (
      <div className="flex flex-col gap-4">
        <Group>
          <Field id="c-title" label="اسم التحدي">
            <Input
              id="c-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="تحدي أصدقاء العمل"
              maxLength={160}
              className="h-14 font-display text-[18px] font-semibold"
            />
          </Field>
          {!initial && (
            <div className="-mt-1 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('title', s)}
                  className="cursor-pointer rounded-full bg-white/[.06] px-3.5 py-2 font-display text-[13px] font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Group>

        <Group title="التحدي يبدأ من" aside={currentGw ? <Tag tone="live">الجولة الحالية GW {currentGw}</Tag> : null}>
          <ChoiceTiles
            label="جولة البداية"
            value={startValue}
            onChange={(v) => {
              if (v === 'custom') return setCustomStart(true);
              setCustomStart(false);
              setStart(v);
            }}
            options={[...starts.map((gw) => ({ value: gw, top: 'GW', label: gw })), { value: 'custom', label: 'جولة تانية' }]}
          />
          {customStart && <GwPicker id="c-start" label="اختار جولة البداية" value={form.startEvent} min={minStartEvent} max={LAST_GW} onChange={setStart} />}

          <div className="h-px bg-white/[.06]" />

          <div className="font-display text-[16px] font-bold md:text-[17px]">وينتهي بعد</div>
          <ChoiceTiles
            label="مدة التحدي"
            value={endValue}
            onChange={(v) => {
              if (v === 'custom') return setCustomEnd(true);
              setCustomEnd(false);
              setDuration(v);
            }}
            options={[
              { value: 4, top: 'جولات', label: '4' },
              { value: 8, top: 'جولات', label: '8' },
              { value: 'season', label: 'آخر الموسم' },
              { value: 'custom', label: 'مخصص' },
            ]}
          />
          {customEnd && <GwPicker id="c-end" label="اختار جولة النهاية" value={form.endEvent} min={form.startEvent} max={LAST_GW} onChange={(v) => set('endEvent', v)} />}

          <div className="rounded-[18px] bg-night p-4">
            <SeasonRange start={form.startEvent} end={form.endEvent} current={currentGw} />
            <p className="mt-3 text-[13.5px] leading-[1.8] text-white/65">
              النقاط بتتحسب من <b dir="ltr" className="font-display font-bold text-white">GW {form.startEvent}</b> لحد{' '}
              <b dir="ltr" className="font-display font-bold text-white">GW {form.endEvent}</b> — {gameweeks(duration)}. مينفعش تبدأ من جولة خلصت.
            </p>
          </div>
        </Group>

        <Group title="صورة التحدي" aside={<Optional />}>
          <label className="group flex cursor-pointer items-center gap-4 rounded-[18px] border-2 border-dashed border-white/15 p-4 transition-colors hover:border-pitch/60 hover:bg-white/[.02]">
            <Crest src={preview} title={form.title} size={56} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-bold">{preview ? 'غيّر الصورة' : 'اختار صورة من جهازك'}</div>
              <div className="mt-0.5 text-[12.5px] text-white/50">JPG أو PNG أو WEBP · حتى 5MB</div>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/70 transition-colors group-hover:text-pitch">
              <CameraIcon size={18} strokeWidth={2.2} />
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickImage} />
          </label>
          {preview && (
            <TextLink className="w-fit text-[13.5px]" onClick={() => { setPreview(''); setForm((f) => ({ ...f, image: '', imageData: '' })); }}>
              شيل الصورة
            </TextLink>
          )}
        </Group>

        {error && <Notice tone="alert">{error}</Notice>}

        <div className="flex flex-col gap-3 pt-1">
          <Button size="lg" knob full onClick={next}>التالي — الجوائز</Button>
          {!initial && (
            <Button variant="secondary" size="lg" full loading={saving} onClick={() => { const p = validateStep1(); if (p) return setError(p); submit(); }}>
              أنشئه دلوقتي من غير جوائز
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2 — prizes & rules (everything optional) ────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex items-center gap-3.5 py-4">
        <Crest src={preview} title={form.title} size={48} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] text-white/50">تحديك</div>
          <div className="truncate font-display text-[17px] font-bold">{form.title}</div>
        </div>
        <span dir="ltr" className="shrink-0 rounded-full bg-pitch px-3.5 py-1.5 font-display text-[13.5px] font-extrabold text-edge">{gwRange(form.startEvent, form.endEvent)}</span>
      </Panel>

      <Group title="الجوائز" aside={<Optional />}>
        <p className="-mt-2 text-[13.5px] text-white/55">شغّل المراكز اللي عايز تكرّمها واكتب الجائزة.</p>
        <div className="flex flex-col gap-2.5">
          {PRIZES.map(([key, label, rank]) => {
            const enabled = enabledPrizes.includes(key);
            return (
              <div key={key} className={cn('rounded-[18px] p-3 transition-colors', enabled ? 'bg-white/[.05]' : 'bg-transparent ring-1 ring-inset ring-white/[.06]')}>
                <div className="flex items-center gap-3">
                  <Medal rank={rank} size={30} />
                  <label htmlFor={`prize-${key}`} className="flex-1 cursor-pointer font-display text-[15px] font-semibold">{label}</label>
                  <Toggle id={`prize-${key}`} checked={enabled} onChange={() => togglePrize(key)} label={`جائزة ${label}`} />
                </div>
                {enabled && (
                  <Input className="mt-3 animate-fadein" value={form[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder="تيشيرت فريقك المفضل" maxLength={300} aria-label={`جائزة ${label}`} />
                )}
              </div>
            );
          })}
        </div>
      </Group>

      <Group title="كلمة للمشاركين" aside={<Optional />}>
        <div>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="ظبط تشكيلتك وتعالى نشوف مين الأحسن…" maxLength={5000} aria-label="كلمة للمشاركين" />
          <div className="mt-2 flex justify-end">
            <span dir="ltr" className="text-[12px] tabular-nums text-white/35">{fmt(form.description.length)} / 5000</span>
          </div>
        </div>
        {links.map((link, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-2 sm:grid-cols-2">
              <Input value={link.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="اسم الرابط" maxLength={100} aria-label="اسم الرابط" />
              <Input dir="ltr" inputMode="url" value={link.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" maxLength={2048} aria-label="عنوان الرابط" />
            </div>
            <button
              type="button"
              aria-label="احذف الرابط"
              onClick={() => set('descriptionLinks', links.filter((_, j) => j !== i))}
              className="press grid size-13 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-edge bg-night-3 text-white/70 hover:text-alert"
            >
              <TrashIcon size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={links.length >= 10}
          onClick={() => set('descriptionLinks', [...links, { label: '', url: '' }])}
          className="inline-flex w-fit cursor-pointer items-center gap-2 font-display text-[14px] font-semibold text-white/80 transition-colors hover:text-pitch disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon size={16} />
          ضيف رابط
        </button>
      </Group>

      <Group
        title="شروط الانضمام"
        aside={<Button variant="secondary" size="sm" onClick={() => setShowRules((v) => !v)}>{showRules ? 'إخفاء' : 'تعديل'}</Button>}
      >
        <p className="-mt-2 text-[13.5px] text-white/55">{showRules ? 'حدد مين يقدر ينضم' : 'مفتوح للكل — مناسب لمعظم التحديات'}</p>
        {showRules ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
            <Field id="r-points" label="أقل إجمالي نقاط">
              <Input id="r-points" type="number" inputMode="numeric" dir="ltr" min={0} value={form.minTotalPoints} onChange={(e) => set('minTotalPoints', e.target.value)} />
            </Field>
            <Field id="r-rank" label="أقصى ترتيب عام">
              <Input id="r-rank" type="number" inputMode="numeric" dir="ltr" min={1} value={form.maxOverallRank} onChange={(e) => set('maxOverallRank', e.target.value)} />
            </Field>
            <Field id="r-started" label="بدأ FPL قبل جولة">
              <Input id="r-started" type="number" inputMode="numeric" dir="ltr" min={1} max={LAST_GW} value={form.latestStartedEvent} onChange={(e) => set('latestStartedEvent', e.target.value)} />
            </Field>
            {visibility === 'public' && (
              <Field id="r-bg" label="رابط صورة الخلفية" aside={<Optional />} className="sm:col-span-3">
                <Input id="r-bg" dir="ltr" inputMode="url" value={form.backgroundImage} onChange={(e) => set('backgroundImage', e.target.value)} placeholder="https://" />
              </Field>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Tag>{form.minTotalPoints > 0 ? `+${fmt(form.minTotalPoints)} نقطة` : 'بدون حد أدنى للنقاط'}</Tag>
            <Tag>{form.maxOverallRank < NO_RANK_LIMIT ? `ترتيب حتى #${fmt(form.maxOverallRank)}` : 'أي ترتيب عام'}</Tag>
            <Tag>الانضمام حتى GW {form.endEvent}</Tag>
          </div>
        )}
      </Group>

      {error && <Notice tone="alert">{error}</Notice>}

      <div className="flex flex-col items-center gap-4 pt-1">
        <Button size="lg" knob full loading={saving} onClick={() => submit()}>{submitLabel}</Button>
        <TextLink onClick={() => { onStep(1); window.scrollTo({ top: 0 }); }}>رجوع للأساسيات</TextLink>
        {visibility === 'private' && <p className="text-center text-[13px] text-white/45">التحدي خاص — بيظهر بس للي معاه الرابط</p>}
      </div>
    </div>
  );
}
