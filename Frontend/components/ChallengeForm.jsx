import React, { useEffect, useState } from 'react';

export const emptyChallenge = {
  title: '',
  description: '',
  prize: '',
  prizeSecond: '',
  prizeThird: '',
  image: '',
  backgroundImage: '',
  startEvent: 1,
  endEvent: 1,
  minTotalPoints: 0,
  maxOverallRank: 10000000,
  latestStartedEvent: 38,
  requiresPlatformLeagueMembership: false,
};

const fieldClass = 'w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-[#22c55e] transition-colors';

const ChallengeForm = ({ initialValue, onSubmit, isSaving, submitLabel }) => {
  const [form, setForm] = useState({ ...emptyChallenge, ...initialValue });

  useEffect(() => setForm({ ...emptyChallenge, ...initialValue }), [initialValue]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      startEvent: Number(form.startEvent),
      endEvent: Number(form.endEvent),
      minTotalPoints: Number(form.minTotalPoints || 0),
      maxOverallRank: Number(form.maxOverallRank || 10000000),
      latestStartedEvent: Number(form.latestStartedEvent || 38),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5 text-right" dir="rtl">
      <div>
        <label className="block mb-2 text-sm font-bold text-gray-300">عنوان التحدي</label>
        <input required value={form.title} onChange={(event) => update('title', event.target.value)} className={fieldClass} maxLength="160" />
      </div>

      <div>
        <label className="block mb-2 text-sm font-bold text-gray-300">الوصف والشروط الإضافية</label>
        <textarea required value={form.description} onChange={(event) => update('description', event.target.value)} className={`${fieldClass} min-h-28 resize-y`} maxLength="5000" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-bold text-gray-300">من جولة</label>
          <input required min="1" max="100" type="number" value={form.startEvent} onChange={(event) => update('startEvent', event.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="block mb-2 text-sm font-bold text-gray-300">إلى جولة</label>
          <input required min="1" max="100" type="number" value={form.endEvent} onChange={(event) => update('endEvent', event.target.value)} className={fieldClass} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
        <h3 className="font-black text-[#22c55e]">شروط القبول</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs font-bold text-gray-400">أقل نقاط
            <input min="0" type="number" value={form.minTotalPoints} onChange={(event) => update('minTotalPoints', event.target.value)} className={`${fieldClass} mt-2`} />
          </label>
          <label className="text-xs font-bold text-gray-400">أقصى ترتيب عام
            <input min="1" type="number" value={form.maxOverallRank} onChange={(event) => update('maxOverallRank', event.target.value)} className={`${fieldClass} mt-2`} />
          </label>
          <label className="text-xs font-bold text-gray-400">آخر جولة مسموح البدء فيها
            <input min="1" max="100" type="number" value={form.latestStartedEvent} onChange={(event) => update('latestStartedEvent', event.target.value)} className={`${fieldClass} mt-2`} />
          </label>
        </div>
        <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-gray-300">
          <input type="checkbox" checked={form.requiresPlatformLeagueMembership} onChange={(event) => update('requiresPlatformLeagueMembership', event.target.checked)} className="w-4 h-4 accent-[#22c55e]" />
          يشترط عضوية دوري FPL Rush
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ['prize', 'الجائزة الأولى'],
          ['prizeSecond', 'الجائزة الثانية'],
          ['prizeThird', 'الجائزة الثالثة'],
          ['image', 'رابط صورة التحدي'],
          ['backgroundImage', 'رابط صورة الخلفية'],
        ].map(([field, label]) => (
          <div key={field} className={field === 'prizeThird' ? 'sm:col-span-2' : ''}>
            <label className="block mb-2 text-sm font-bold text-gray-300">{label} <span className="text-gray-500 text-xs">(اختياري)</span></label>
            <input value={form[field] || ''} onChange={(event) => update(field, event.target.value)} className={fieldClass} maxLength={field.includes('Image') || field === 'image' ? 2048 : 300} />
          </div>
        ))}
      </div>

      <button disabled={isSaving} type="submit" className="w-full bg-[#22c55e] text-slate-950 rounded-xl py-4 font-black hover:bg-white transition-colors disabled:opacity-50">
        {isSaving ? 'جارٍ الحفظ...' : submitLabel}
      </button>
    </form>
  );
};

export default ChallengeForm;
