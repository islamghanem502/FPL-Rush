import { useState } from 'react';
import { cn } from '@/lib/cn';
import { readImage } from '@/lib/image';
import { fmt } from '@/lib/format';
import { Card, Divider } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip, LiveChip } from '@/components/ui/Chip';
import { Field, Input, Textarea, Select, Tile, Notice } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Misc';

const LAST_GW = 38;
const NO_RANK_LIMIT = 10_000_000;
const SUGGESTIONS = ['تحدي الشلة', 'تحدي العمل', 'تحدي العيلة'];
const PRIZES = [
  ['prize', 'المركز الأول'],
  ['prizeSecond', 'المركز الثاني'],
  ['prizeThird', 'المركز الثالث'],
];

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

// Step pills in the chrome — exported so the page can render them up top.
export function Steps({ step }) {
  const pill = (n, label) => (
    <div
      className={cn(
        'flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-[12.5px]',
        step === n ? 'bg-brand font-black text-ink' : step > n ? 'bg-live font-black text-ink' : 'border-[1.5px] border-canvas/45 font-bold text-canvas',
      )}
    >
      <span className="num text-[13px]">{n}</span>
      <span>{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      {pill(1, 'الأساسيات')}
      {pill(2, 'الجوائز والشروط')}
    </div>
  );
}

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
    return (
      <div className="space-y-3">
        <Card>
          <Field label="اسم التحدي">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="تحدي أصدقاء العمل" maxLength={160} />
          </Field>
          {!initial && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => set('title', s)} className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-bold">
                  {s}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-black">التحدي يبدأ من</span>
            {currentGw && <LiveChip>الجولة الحالية GW {currentGw}</LiveChip>}
          </div>
          <div className="mt-3 flex gap-2">
            {starts.map((gw) => (
              <Tile key={gw} label="GW" value={gw} active={!customStart && form.startEvent === gw} onClick={() => { setCustomStart(false); setStart(gw); }} />
            ))}
            <Tile value="جولة أخرى" active={customStart} onClick={() => setCustomStart(true)} />
          </div>
          {customStart && (
            <Select className="mt-2.5" value={form.startEvent} onChange={(e) => setStart(Number(e.target.value))}>
              {gwList(minStartEvent, LAST_GW).map((gw) => <option key={gw} value={gw}>GW {gw}</option>)}
            </Select>
          )}

          <Divider />
          <span className="text-[12.5px] font-black">وينتهي بعد</span>
          <div className="mt-2.5 flex gap-2">
            {[[4, '4 جولات'], [8, '8 جولات'], ['season', 'آخر الموسم']].map(([n, label]) => {
              const active = !customEnd && (n === 'season' ? form.endEvent === LAST_GW : duration === n && form.endEvent !== LAST_GW);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setCustomEnd(false); setDuration(n); }}
                  className={cn('flex-1 rounded-chip border py-2.5 text-[13px]', active ? 'border-ink bg-ink font-black text-brand' : 'border-line-strong bg-paper font-bold text-ink')}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCustomEnd(true)}
              className={cn('flex-1 rounded-chip border py-2.5 text-[13px]', customEnd ? 'border-ink bg-ink font-black text-brand' : 'border-line-strong bg-paper font-bold text-ink')}
            >
              مخصص
            </button>
          </div>
          {customEnd && (
            <Select className="mt-2.5" value={form.endEvent} onChange={(e) => set('endEvent', Number(e.target.value))}>
              {gwList(form.startEvent, LAST_GW).map((gw) => <option key={gw} value={gw}>GW {gw}</option>)}
            </Select>
          )}
          <Notice className="mt-3.5">
            تُحسب نقاط المشاركين من <b className="font-black">GW {form.startEvent}</b> حتى <b className="font-black">GW {form.endEvent}</b>. لا يمكن البدء من جولة انتهت.
          </Notice>
        </Card>

        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-black">صورة التحدي</span>
            <span className="text-[11.5px] font-bold text-muted">اختياري</span>
          </div>
          <label className="mt-2.5 flex cursor-pointer items-center gap-3.5 rounded-chip border border-dashed border-line-strong p-4">
            <Logo src={preview} size={52} />
            <div className="min-w-0">
              <div className="text-[14px] font-black">{preview ? 'تغيير الصورة' : 'اختر صورة من جهازك'}</div>
              <div className="text-[12px] font-semibold text-muted">تتحوّل تلقائيًا لألوان FPL Rush · حتى 5MB</div>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickImage} />
          </label>
          {preview && (
            <Button variant="tertiary" size="sm" className="mt-1" onClick={() => { setPreview(''); setForm((f) => ({ ...f, image: '', imageData: '' })); }}>
              إزالة الصورة
            </Button>
          )}
        </Card>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="pt-2">
          <Button size="lg" full onClick={next}>التالي — الجوائز</Button>
          {!initial && (
            <Button variant="tertiary" full className="mt-2" loading={saving} onClick={() => { const p = validateStep1(); if (p) return setError(p); submit(); }}>
              إنشاء سريع بدون جوائز
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2 — prizes & rules (everything optional) ────────────────────────
  return (
    <div className="space-y-3">
      <Card tone="ink" className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11.5px] font-bold opacity-75">تحديك</div>
          <div className="truncate text-[17px] font-black">{form.title}</div>
        </div>
        <div className="shrink-0 rounded-panel bg-brand px-3 py-1.5 text-center text-ink">
          <div className="num text-[10px] tracking-[.1em]">GW</div>
          <div className="num text-[15px] leading-none">{form.startEvent}—{form.endEvent}</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[16px] font-black">الجوائز</span>
          <span className="text-[11.5px] font-bold text-muted">اختياري</span>
        </div>
        <p className="mt-0.5 text-[12.5px] font-semibold text-muted">اختر المراكز التي تريد تكريمها واكتب الجائزة.</p>
        <div className="mt-3.5 space-y-2">
          {PRIZES.map(([key, label]) => {
            const enabled = enabledPrizes.includes(key);
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => togglePrize(key)}
                  className="flex w-full items-center gap-3 rounded-chip border border-line-strong bg-paper px-3.5 py-3 text-right"
                >
                  <span className={cn('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px]', enabled ? 'bg-ink' : 'border-2 border-ink')}>
                    {enabled && <span className="block h-2.5 w-2.5 rounded-[2px] bg-brand" />}
                  </span>
                  <span className={cn('text-[14.5px]', enabled ? 'font-black' : 'font-bold')}>{label}</span>
                </button>
                {enabled && (
                  <Input className="mt-2" value={form[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder="تيشيرت فريقك المفضل" maxLength={300} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <Field label="كلمة للمشاركين" optional>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="ظبط تشكيلتك وتعالى نشوف مين الأحسن…" maxLength={5000} />
        </Field>
        <div className="mt-2 flex items-center justify-between">
          <button type="button" disabled={links.length >= 10} className="text-[12.5px] font-bold disabled:opacity-40" onClick={() => set('descriptionLinks', [...links, { label: '', url: '' }])}>
            + إضافة رابط
          </button>
          <span className="mono text-[11px] text-muted">{fmt(form.description.length)} / 5000</span>
        </div>
        {links.map((link, i) => (
          <div key={i} className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={link.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="اسم الرابط" maxLength={100} />
              <Input dir="ltr" inputMode="url" value={link.url} onChange={(e) => setLink(i, 'url', e.target.value)} placeholder="https://" maxLength={2048} />
            </div>
            <Button variant="tertiary" size="sm" onClick={() => set('descriptionLinks', links.filter((_, j) => j !== i))}>حذف</Button>
          </div>
        ))}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14.5px] font-black">شروط الانضمام</div>
            <div className="text-[12.5px] font-semibold text-muted">{showRules ? 'حدد من يستطيع الانضمام' : 'مفتوح للجميع — مناسب لمعظم التحديات'}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowRules((v) => !v)}>{showRules ? 'إخفاء' : 'تعديل'}</Button>
        </div>
        {showRules ? (
          <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
            <Field label="أقل إجمالي نقاط">
              <Input type="number" inputMode="numeric" min={0} value={form.minTotalPoints} onChange={(e) => set('minTotalPoints', e.target.value)} />
            </Field>
            <Field label="أقصى ترتيب عام">
              <Input type="number" inputMode="numeric" min={1} value={form.maxOverallRank} onChange={(e) => set('maxOverallRank', e.target.value)} />
            </Field>
            <Field label="بدأ FPL قبل جولة">
              <Input type="number" inputMode="numeric" min={1} max={LAST_GW} value={form.latestStartedEvent} onChange={(e) => set('latestStartedEvent', e.target.value)} />
            </Field>
            {visibility === 'public' && (
              <Field label="رابط صورة الخلفية" optional className="sm:col-span-3">
                <Input dir="ltr" inputMode="url" value={form.backgroundImage} onChange={(e) => set('backgroundImage', e.target.value)} placeholder="https://" />
              </Field>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip variant="cream">{form.minTotalPoints > 0 ? `+${fmt(form.minTotalPoints)} نقطة` : 'بدون حد أدنى للنقاط'}</Chip>
            <Chip variant="cream">{form.maxOverallRank < NO_RANK_LIMIT ? `ترتيب حتى #${fmt(form.maxOverallRank)}` : 'أي ترتيب عام'}</Chip>
            <Chip variant="cream">الانضمام حتى GW {form.endEvent}</Chip>
          </div>
        )}
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="pt-2">
        <Button size="lg" full loading={saving} onClick={() => submit()}>{submitLabel}</Button>
        <Button variant="tertiary" full className="mt-2" onClick={() => { onStep(1); window.scrollTo({ top: 0 }); }}>رجوع للأساسيات</Button>
        {visibility === 'private' && <p className="mt-3 text-center text-[12.5px] font-semibold text-muted">التحدي خاص — يظهر فقط لمن يملك الرابط</p>}
      </div>
    </div>
  );
}
