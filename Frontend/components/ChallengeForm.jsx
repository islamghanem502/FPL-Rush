import React, { useEffect, useMemo, useState } from 'react';

export const emptyChallenge = {
  title: '',
  description: '',
  descriptionLinks: [],
  prize: '',
  prizeSecond: '',
  prizeThird: '',
  image: '',
  imageData: '',
  backgroundImage: '',
  startEvent: 1,
  endEvent: 1,
  minTotalPoints: 0,
  maxOverallRank: 10000000,
  latestStartedEvent: 38,
};

const fieldClass = 'w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#22c55e] transition-colors';
const linkRegex = /^https?:\/\//i;

const readImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('اختَر ملف صورة صالحًا (JPG أو PNG أو WEBP)'));
  if (file.size > 5 * 1024 * 1024) return reject(new Error('حجم الصورة يجب ألا يتجاوز 5MB'));

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('تعذر فتح الصورة'));
    image.onload = () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const ChallengeForm = ({ initialValue, onSubmit, isSaving, submitLabel, currentGameweek = 1 }) => {
  const minimumStartEvent = Math.min(38, Math.max(1, Number(currentGameweek) || 1));
  const [form, setForm] = useState({ ...emptyChallenge, ...initialValue });
  const [imagePreview, setImagePreview] = useState(initialValue?.image || '');
  const [imageError, setImageError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPrizes, setShowPrizes] = useState(Boolean(initialValue?.prize || initialValue?.prizeSecond || initialValue?.prizeThird));
  const [selectedPrizes, setSelectedPrizes] = useState(() => (
    ['prize', 'prizeSecond', 'prizeThird'].filter((field) => Boolean(initialValue?.[field]))
  ));

  useEffect(() => {
    const next = { ...emptyChallenge, ...initialValue };
    const start = Math.min(38, Math.max(minimumStartEvent, Number(next.startEvent) || minimumStartEvent));
    const end = Math.min(38, Math.max(start, Number(next.endEvent) || start));
    setForm({
      ...next,
      startEvent: start,
      endEvent: end,
      descriptionLinks: (next.descriptionLinks || []).map((link) => ({
        label: String(link?.label || ''),
        url: String(link?.url || '')
      }))
    });
    setImagePreview(next.image || '');
    setImageError('');
    setLinkError('');
    setSelectedPrizes(['prize', 'prizeSecond', 'prizeThird'].filter((field) => Boolean(next[field])));
    setShowPrizes(Boolean(next.prize || next.prizeSecond || next.prizeThird));
  }, [initialValue, minimumStartEvent]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const startOptions = useMemo(() => Array.from({ length: 39 - minimumStartEvent }, (_, index) => minimumStartEvent + index), [minimumStartEvent]);
  const endOptions = useMemo(() => Array.from({ length: 39 - Number(form.startEvent) }, (_, index) => Number(form.startEvent) + index), [form.startEvent]);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const imageData = await readImage(file);
      setImagePreview(imageData);
      setForm((current) => ({ ...current, image: '', imageData }));
    } catch (error) {
      setImageError(error.message);
      event.target.value = '';
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setForm((current) => ({ ...current, image: '', imageData: '' }));
  };

  const addLink = () => {
    setLinkError('');
    update('descriptionLinks', [...(form.descriptionLinks || []), { label: '', url: '' }]);
  };
  const updateLink = (index, field, value) => {
    setLinkError('');
    update('descriptionLinks', (form.descriptionLinks || []).map((link, linkIndex) => linkIndex === index ? { ...link, [field]: value } : link));
  };
  const removeLink = (index) => {
    setLinkError('');
    update('descriptionLinks', (form.descriptionLinks || []).filter((_, linkIndex) => linkIndex !== index));
  };

  const togglePrize = (field) => {
    setSelectedPrizes((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  };

  const submit = (event) => {
    event.preventDefault();
    setImageError('');
    setLinkError('');
    const links = (form.descriptionLinks || [])
      .map((link) => ({ label: String(link?.label || '').trim(), url: String(link?.url || '').trim() }))
      .filter((link) => link.label || link.url);
    const invalidLink = links.find((link) => !link.label || !linkRegex.test(link.url));
    if (invalidLink) {
      setLinkError('تأكد من كتابة اسم كل رابط ورابط يبدأ بـ https:// أو http://');
      return;
    }
    const payload = {
      ...form,
      descriptionLinks: links,
      startEvent: Number(form.startEvent),
      endEvent: Number(form.endEvent),
      minTotalPoints: Number(form.minTotalPoints || 0),
      maxOverallRank: Number(form.maxOverallRank || 10000000),
      latestStartedEvent: Number(form.latestStartedEvent || 38),
      prize: selectedPrizes.includes('prize') ? form.prize : '',
      prizeSecond: selectedPrizes.includes('prizeSecond') ? form.prizeSecond : '',
      prizeThird: selectedPrizes.includes('prizeThird') ? form.prizeThird : '',
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-6 text-right" dir="rtl">
      <div>
        <label className="block mb-2 text-sm font-black text-gray-200">1. عنوان التحدي</label>
        <input required value={form.title} onChange={(event) => update('title', event.target.value)} className={fieldClass} maxLength="160" placeholder="مثال: تحدي أصدقاء العمل" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-sm font-black text-gray-200">2. صورة التحدي <span className="text-xs text-gray-500">(اختيارية)</span></label>
          {imagePreview && <button type="button" onClick={removeImage} className="text-xs font-bold text-red-300 hover:text-red-200">إزالة الصورة</button>}
        </div>
        <label className="min-h-28 rounded-2xl border border-dashed border-slate-600 bg-slate-950/40 hover:border-[#22c55e]/60 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden">
          {imagePreview ? <img src={imagePreview} alt="معاينة صورة التحدي" className="w-full max-h-48 object-cover" /> : <><span className="text-3xl">🖼️</span><span className="mt-2 text-sm font-bold text-gray-300">اضغط لاختيار صورة من جهازك</span><span className="mt-1 text-xs text-gray-500">JPG / PNG / WEBP حتى 5MB</span></>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" />
        </label>
        {imageError && <p className="mt-2 text-xs font-bold text-red-300">{imageError}</p>}
      </div>

      <div>
        <div className="rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 mb-3">
          <p className="text-sm leading-6 text-gray-200">تحسب نقاط المشتركين من الجولة التي تختارها حتى نهاية التحدي. لا يمكن بدء التحدي من جولة انتهت.</p>
          <p className="text-xs text-[#22c55e] mt-1">الجولة الحالية: GW {minimumStartEvent} — اختر البداية من هذه الجولة أو جولة لاحقة.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-black text-gray-200">3. من جولة
            <select required value={form.startEvent} onChange={(event) => { const start = Number(event.target.value); update('startEvent', start); if (Number(form.endEvent) < start) update('endEvent', start); }} className={`${fieldClass} mt-2`}>
              {startOptions.map((event) => <option key={event} value={event}>GW {event}</option>)}
            </select>
          </label>
          <label className="text-sm font-black text-gray-200">إلى جولة
            <select required value={form.endEvent} onChange={(event) => update('endEvent', Number(event.target.value))} className={`${fieldClass} mt-2`}>
              {endOptions.map((event) => <option key={event} value={event}>GW {event}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-black text-gray-200">4. الوصف والشروط الإضافية <span className="text-xs text-gray-500">(اختياري)</span></label>
        <textarea value={form.description} onChange={(event) => update('description', event.target.value)} className={`${fieldClass} min-h-28 resize-y`} maxLength="5000" placeholder="اكتب وصفًا مختصرًا أو شروطًا خاصة بالتحدي..." />
        <p className="mt-2 text-xs text-gray-500">لإضافة روابط قابلة للضغط، استخدم زر «إضافة رابط» أسفل الوصف.</p>
        <div className="mt-3 space-y-2">
          {(form.descriptionLinks || []).map((link, index) => (
            <div key={index} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
              <input value={link.label} onChange={(event) => updateLink(index, 'label', event.target.value)} className={fieldClass} placeholder="اسم الرابط" maxLength="100" />
              <input value={link.url} onChange={(event) => updateLink(index, 'url', event.target.value)} className={fieldClass} placeholder="https://example.com" dir="ltr" inputMode="url" maxLength="2048" />
              <button type="button" onClick={() => removeLink(index)} className="rounded-xl border border-red-500/30 px-3 py-3 text-sm font-black text-red-300">حذف</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLink} disabled={(form.descriptionLinks || []).length >= 10} className="mt-3 rounded-xl border border-slate-600 px-4 py-3 text-sm font-black text-gray-200 hover:border-[#22c55e]/50 hover:text-[#22c55e] disabled:cursor-not-allowed disabled:opacity-40">+ إضافة رابط</button>
        {linkError && <p className="mt-2 text-xs font-bold text-red-300">{linkError}</p>}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 overflow-hidden">
        <button type="button" onClick={() => setShowPrizes((value) => !value)} className="w-full flex items-center justify-between gap-3 p-4 text-right hover:bg-slate-800/50">
          <span><span className="text-sm font-black text-gray-200">5. الجوائز</span><span className="block text-xs text-gray-500 mt-1">اختيارية — أضف فقط المراكز التي تريدها</span></span>
          <span className="text-[#22c55e] text-xl">{showPrizes ? '−' : '+'}</span>
        </button>
        {showPrizes && <div className="p-4 pt-0 space-y-3">
          {[['prize', 'المركز الأول 🥇'], ['prizeSecond', 'المركز الثاني 🥈'], ['prizeThird', 'المركز الثالث 🥉']].map(([field, label]) => {
            const selected = selectedPrizes.includes(field);
            return <div key={field} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-black text-gray-200"><input type="checkbox" checked={selected} onChange={() => togglePrize(field)} className="w-4 h-4 accent-[#22c55e]" /> {label}</label>
              {selected && <input required value={form[field] || ''} onChange={(event) => update(field, event.target.value)} className={`${fieldClass} mt-3`} placeholder="مثال: قميص أو جائزة نقدية" maxLength="300" />}
            </div>;
          })}
        </div>}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 overflow-hidden">
        <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-800/50">
          <span><span className="text-sm font-black text-gray-200">إعدادات متقدمة</span><span className="block text-xs text-gray-500 mt-1">اختيارية — القيم الافتراضية مناسبة لمعظم التحديات</span></span>
          <span className="text-gray-300 text-xl">{showAdvanced ? '−' : '+'}</span>
        </button>
        {showAdvanced && <div className="p-4 pt-0 space-y-4">
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm font-black text-violet-200">شروط القبول</p>
            <p className="mt-1 text-xs text-gray-500">يمكنك تعديل القيم الافتراضية إذا أردت تقييد الانضمام.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-bold text-gray-400">أقل نقاط
              <input min="0" type="number" value={form.minTotalPoints} onChange={(event) => update('minTotalPoints', event.target.value)} className={`${fieldClass} mt-2`} />
            </label>
            <label className="text-xs font-bold text-gray-400">أقصى ترتيب عام
              <input min="1" type="number" value={form.maxOverallRank} onChange={(event) => update('maxOverallRank', event.target.value)} className={`${fieldClass} mt-2`} />
            </label>
            <label className="text-xs font-bold text-gray-400">آخر جولة مسموح البدء فيها
              <input min="1" max="38" type="number" value={form.latestStartedEvent} onChange={(event) => update('latestStartedEvent', event.target.value)} className={`${fieldClass} mt-2`} />
            </label>
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold text-gray-400">رابط صورة الخلفية <span className="text-gray-600">(اختياري)</span></label>
            <input value={form.backgroundImage || ''} onChange={(event) => update('backgroundImage', event.target.value)} className={fieldClass} placeholder="https://..." dir="ltr" inputMode="url" maxLength="2048" />
          </div>
        </div>}
      </div>

      <button disabled={isSaving} type="submit" className="w-full bg-[#22c55e] text-slate-950 rounded-xl py-4 font-black hover:bg-white active:scale-[0.99] transition-all disabled:opacity-50">
        {isSaving ? 'جارٍ الحفظ...' : submitLabel}
      </button>
    </form>
  );
};

export default ChallengeForm;
