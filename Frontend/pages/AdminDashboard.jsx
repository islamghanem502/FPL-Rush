import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  useCreateChallenge,
  useChallenges,
  useDeleteChallenge,
  useCloseChallenge,
  useReorderChallenges,
  // PvP
  usePvPChallenges,
  useCreatePvPChallenge,
  useDeletePvPChallenge,
  useSyncPvPResults,
  useClosePvPChallenge,
  useSearchPlayers,
} from "../hooks/useAuthQuery";

function PlayerSearchInput({ placeholder, value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [showOptions, setShowOptions] = useState(false);
  const { data: players } = useSearchPlayers(query);

  const wrapperRef = React.useRef(null);
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input 
        type="text" 
        placeholder={placeholder} 
        value={query}
        className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs font-bold text-white focus:border-purple-500 outline-none"
        onChange={(e) => {
          setQuery(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
      />
      {showOptions && query.length >= 2 && players?.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          {players.map(p => (
            <div 
              key={p.id} 
              className="p-3 border-b border-slate-700/50 hover:bg-slate-700 cursor-pointer flex items-center gap-3"
              onClick={() => {
                setQuery(p.name);
                onSelect(p);
                setShowOptions(false);
              }}
            >
              <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full border border-slate-600 bg-slate-900 object-cover" />
              <div>
                <div className="text-white text-xs font-bold">{p.name}</div>
                <div className="text-gray-400 text-[10px]">{p.full_name} - {p.team_code}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Classic initial state ───────────────────────────
const classicInitial = {
  title: "",
  description: "",
  prize: "",
  prizeSecond: "",
  prizeThird: "",
  image: "",
  backgroundImage: "",
  joinCode: "",
  startEvent: 30,
  endEvent: 35,
  minTotalPoints: 0,
  maxOverallRank: 10000000,
  minStartedEvent: 1,
};

// ─── PvP initial state ────────────────────────────────
const pvpInitial = {
  title: "",
  description: "",
  prize: "",
  prizeSecond: "",
  prizeThird: "",
  image: "",
  backgroundImage: "",
  joinCode: "",
  gw: "",
  minStartedEvent: 1,
  matchups: [{ p1_id: "", p1_name: "", p1_photo: "", p2_id: "", p2_name: "", p2_photo: "", isDouble: false }],
};

// ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [mode, setMode] = useState("classic"); // "classic" | "pvp"

  // ── Classic state & hooks ──
  const [classicForm, setClassicForm] = useState(classicInitial);
  const createClassic = useCreateChallenge();
  const deleteClassic = useDeleteChallenge();
  const closeClassic = useCloseChallenge();
  const reorderMutation = useReorderChallenges();
  const { data: challenges, isLoading: classicLoading } = useChallenges();

  // ── PvP state & hooks ──
  const [pvpForm, setPvpForm] = useState(pvpInitial);
  const createPvP = useCreatePvPChallenge();
  const deletePvP = useDeletePvPChallenge();
  const syncPvP = useSyncPvPResults();
  const closePvP = useClosePvPChallenge();
  const { data: pvpChallenges, isLoading: pvpLoading } = usePvPChallenges();

  const [orderedChallenges, setOrderedChallenges] = useState([]);
  
  useEffect(() => {
    // Merge both types of challenges into one list and sort globally by position
    const combined = [...(challenges || []), ...(pvpChallenges || [])];
    combined.sort((a, b) => (a.position || 0) - (b.position || 0));
    setOrderedChallenges(combined);
  }, [challenges, pvpChallenges]);

  // ── Classic handlers ──
  const handleClassicSubmit = (e) => {
    e.preventDefault();
    createClassic.mutate(classicForm, {
      onSuccess: () => {
        alert("تم نشر التحدي بنجاح! 🎉");
        setClassicForm(classicInitial);
        e.target.reset();
      },
      onError: (err) =>
        alert("خطأ في الإنشاء: " + (err.response?.data?.message || "فشل الاتصال")),
    });
  };

  const handleClose = (id, title) => {
    if (window.confirm(`🚨 هل أنت متأكد من إنهاء تحدي "${title}"؟\nسيتم تثبيت الترتيب الحالي وإعلان الثلاثة الأوائل كفائزين نهائيين.`))
      closeClassic.mutate(id);
  };

  const reorderLocal = (list, src, dst) => {
    const r = Array.from(list);
    const [rm] = r.splice(src, 1);
    r.splice(dst, 0, rm);
    return r;
  };

  const onDragEnd = (result) => {
    if (!result?.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    
    const next = reorderLocal(orderedChallenges, src, dst);
    setOrderedChallenges(next);
    reorderMutation.mutate(next.map((c) => c._id), {
      onError: (err) =>
        alert("فشل حفظ الترتيب: " + (err.response?.data?.message || "حاول مرة أخرى")),
    });
  };

  // ── PvP matchup helpers ──
  const addMatchup = () =>
    setPvpForm((f) => ({
      ...f,
      matchups: [...f.matchups, { p1_id: "", p1_name: "", p1_photo: "", p2_id: "", p2_name: "", p2_photo: "", isDouble: false }],
    }));

  const removeMatchup = (idx) =>
    setPvpForm((f) => ({ ...f, matchups: f.matchups.filter((_, i) => i !== idx) }));

  const updateMatchup = (idx, field, value) => {
    setPvpForm((f) => {
      const m = [...f.matchups];
      m[idx] = { ...m[idx], [field]: value };
      return { ...f, matchups: m };
    });
  };

  const handlePvPSubmit = (e) => {
    e.preventDefault();
    
    // Validate that all matchups have valid IDs
    const missingPlayers = pvpForm.matchups.some(m => !m.p1_id || !m.p2_id);
    if (missingPlayers) {
      alert("يرجى اختيار اللاعبين من القائمة المنسدلة لكل المقارنات!");
      return;
    }

    const payload = {
      ...pvpForm,
      gw: parseInt(pvpForm.gw),
      minStartedEvent: parseInt(pvpForm.minStartedEvent),
      matchups: pvpForm.matchups.map((m) => ({
        ...m,
        p1_id: parseInt(m.p1_id),
        p2_id: parseInt(m.p2_id),
      })),
    };
    createPvP.mutate(payload, {
      onSuccess: () => {
        alert("تم نشر تحدي PvP بنجاح! ⚔️");
        setPvpForm(pvpInitial);
        e.target.reset();
      },
      onError: (err) =>
        alert("خطأ: " + (err.response?.data?.message || "فشل الاتصال")),
    });
  };

  const handleSyncPvP = (id, title) => {
    if (window.confirm(`🔄 مزامنة نتائج "${title}"؟`))
      syncPvP.mutate(id);
  };

  const handleClosePvP = (id, title) => {
    if (window.confirm(`🚨 هل أنت متأكد من إنهاء تحدي PvP "${title}"؟\nسيتم تثبيت الترتيب الحالي وإعلان الثلاثة الأوائل كفائزين نهائيين.`))
      closePvP.mutate(id);
  };

  const totalCount = orderedChallenges.length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 md:p-12 text-white text-right" dir="rtl">

        {/* ── Header ── */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-[#22c55e] italic tracking-tighter">
              لوحة التحكم 🛠️
            </h1>
            <p className="text-gray-400 mt-2 font-bold">
              إدارة تحديات FPL Rush والتحكم في القوانين
            </p>
          </div>
          <div className="bg-slate-800 px-8 py-5 rounded-[32px] border border-slate-700 shadow-2xl flex items-center gap-6">
            <div className="text-center">
              <span className="text-gray-500 block text-[10px] font-black uppercase mb-1">إجمالي التحديات</span>
              <span className="text-white text-3xl font-black">{totalCount}</span>
            </div>
            <div className="w-[1px] h-10 bg-slate-700" />
            <div className="text-center">
              <span className="text-gray-500 block text-[10px] font-black uppercase mb-1">حالة السيرفر</span>
              <span className="text-[#22c55e] text-sm font-black italic">متصل 🟢</span>
            </div>
          </div>
        </header>

        {/* ── Mode Switcher ── */}
        <div className="flex gap-3 mb-10 bg-slate-800/60 border border-slate-700 rounded-[20px] p-2 w-fit">
          <button
            onClick={() => setMode("classic")}
            className={`px-8 py-3 rounded-[14px] font-black text-sm uppercase italic tracking-tight transition-all duration-300 ${
              mode === "classic"
                ? "bg-[#22c55e] text-slate-950 shadow-lg shadow-[#22c55e]/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🏆 إضافة Classic
          </button>
          <button
            onClick={() => setMode("pvp")}
            className={`px-8 py-3 rounded-[14px] font-black text-sm uppercase italic tracking-tight transition-all duration-300 ${
              mode === "pvp"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ⚔️ إضافة PvP
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* ══════════════════════════════════════════════
              LEFT COLUMN: FORMS
          ══════════════════════════════════════════════ */}
          <div className="xl:col-span-5 relative">
            
            {mode === "classic" && (
              <form
                onSubmit={handleClassicSubmit}
                className="bg-slate-800 p-8 rounded-[40px] border border-slate-700 sticky top-8 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-[#22c55e]" />
                <h2 className="text-2xl font-black mb-8 text-white flex items-center gap-2">
                  🏆 نشر تحدي Classic جديد
                </h2>

                <div className="space-y-5">
                  {[
                    { label: "عنوان التحدي", field: "title", placeholder: "مثلاً: دوري رمضان الكبير", required: true },
                    { label: "الجائزة الأولى (مطلوب)", field: "prize", placeholder: "مثلاً: 1000 جنيه كاش", required: true },
                    { label: "الجائزة الثانية (اختياري)", field: "prizeSecond", placeholder: "مثلاً: 500 جنيه" },
                    { label: "الجائزة الثالثة (اختياري)", field: "prizeThird", placeholder: "مثلاً: 250 جنيه" },
                    { label: "كود الانضمام (اختياري)", field: "joinCode", placeholder: "اتركه فارغاً لعدم طلب كود" },
                  ].map(({ label, field, placeholder, required }) => (
                    <div key={field}>
                      <label className="block text-xs font-black text-gray-500 mb-2 mr-1">{label}</label>
                      <input
                        required={required}
                        type="text"
                        placeholder={placeholder}
                        value={classicForm[field]}
                        className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-[#22c55e] outline-none transition-all font-bold"
                        onChange={(e) => setClassicForm({ ...classicForm, [field]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1">وصف التحدي</label>
                    <textarea
                      required
                      placeholder="اكتب تفاصيل وشروط التحدي هنا..."
                      value={classicForm.description}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-[#22c55e] outline-none transition-all font-bold text-sm h-24 resize-none"
                      onChange={(e) => setClassicForm({ ...classicForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-2 mr-1">من جولة</label>
                      <input type="number" placeholder="30" value={classicForm.startEvent}
                        className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 font-bold"
                        onChange={(e) => setClassicForm({ ...classicForm, startEvent: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 mb-2 mr-1">إلى جولة</label>
                      <input type="number" placeholder="38" value={classicForm.endEvent}
                        className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 font-bold"
                        onChange={(e) => setClassicForm({ ...classicForm, endEvent: parseInt(e.target.value) })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1 italic">رابط الصورة (URL)</label>
                    <input type="text" placeholder="https://..." value={classicForm.image}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-xs"
                      onChange={(e) => setClassicForm({ ...classicForm, image: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1 italic">صورة خلفية (URL اختياري)</label>
                    <input type="text" placeholder="https://..." value={classicForm.backgroundImage}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-xs"
                      onChange={(e) => setClassicForm({ ...classicForm, backgroundImage: e.target.value })} />
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-700 space-y-4">
                    <h3 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em] mb-4">شروط الدخول (اختياري)</h3>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-2 mr-1 italic">أقصى جولة لبداية الحساب</label>
                      <input type="number" placeholder="مثلاً: 1" value={classicForm.minStartedEvent}
                        className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs text-white"
                        onChange={(e) => setClassicForm({ ...classicForm, minStartedEvent: parseInt(e.target.value) })} />
                    </div>
                    <input type="number" placeholder="أقل نقاط إجمالية مطلوبة" value={classicForm.minTotalPoints === 0 ? '' : classicForm.minTotalPoints}
                      className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs"
                      onChange={(e) => setClassicForm({ ...classicForm, minTotalPoints: e.target.value === '' ? 0 : parseInt(e.target.value) })} />
                    <input type="number" placeholder="أقصى ترتيب عالمي مسموح به" value={classicForm.maxOverallRank === 10000000 ? '' : classicForm.maxOverallRank}
                      className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs"
                      onChange={(e) => setClassicForm({ ...classicForm, maxOverallRank: e.target.value === '' ? 10000000 : parseInt(e.target.value) })} />
                  </div>
                </div>

                <button type="submit" disabled={createClassic.isPending}
                  className="w-full mt-10 bg-[#22c55e] text-slate-950 font-black py-5 rounded-2xl hover:bg-white transition-all shadow-xl shadow-[#22c55e]/10 active:scale-95 disabled:opacity-50 text-lg uppercase italic tracking-tighter">
                  {createClassic.isPending ? "جاري الحفظ..." : "نشر التحدي للملعب 🚀"}
                </button>
              </form>
            )}

            {mode === "pvp" && (
              <form
                onSubmit={handlePvPSubmit}
                className="bg-slate-800 p-8 rounded-[40px] border border-slate-700 sticky top-8 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
                <h2 className="text-2xl font-black mb-8 text-white flex items-center gap-2">
                  ⚔️ نشر تحدي PvP جديد
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1">عنوان التحدي</label>
                    <input required type="text" placeholder="مثلاً: معركة الجولة 30" value={pvpForm.title}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-purple-500 outline-none transition-all font-bold"
                      onChange={(e) => setPvpForm({ ...pvpForm, title: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1">وصف التحدي</label>
                    <textarea placeholder="تفاصيل المعركة..." value={pvpForm.description}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-purple-500 outline-none transition-all font-bold text-sm h-20 resize-none"
                      onChange={(e) => setPvpForm({ ...pvpForm, description: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1">الجولة (GW) <span className="text-purple-400">*</span></label>
                    <input required type="number" placeholder="مثلاً: 30" value={pvpForm.gw}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-purple-500 outline-none font-bold"
                      onChange={(e) => setPvpForm({ ...pvpForm, gw: e.target.value })} />
                  </div>

                  {[
                    { label: "الجائزة الأولى", field: "prize", placeholder: "مثلاً: 500 جنيه", required: true },
                    { label: "الجائزة الثانية (اختياري)", field: "prizeSecond", placeholder: "مثلاً: 250 جنيه" },
                    { label: "الجائزة الثالثة (اختياري)", field: "prizeThird", placeholder: "اختياري" },
                    { label: "كود الانضمام (اختياري)", field: "joinCode", placeholder: "اتركه فارغاً" },
                  ].map(({ label, field, placeholder, required }) => (
                    <div key={field}>
                      <label className="block text-xs font-black text-gray-500 mb-2 mr-1">{label}</label>
                      <input required={required} type="text" placeholder={placeholder} value={pvpForm[field]}
                        className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 focus:border-purple-500 outline-none font-bold"
                        onChange={(e) => setPvpForm({ ...pvpForm, [field]: e.target.value })} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1 italic">رابط الصورة (URL)</label>
                    <input type="text" placeholder="https://..." value={pvpForm.image}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-xs"
                      onChange={(e) => setPvpForm({ ...pvpForm, image: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1 italic">صورة خلفية (URL اختياري)</label>
                    <input type="text" placeholder="https://..." value={pvpForm.backgroundImage}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-xs"
                      onChange={(e) => setPvpForm({ ...pvpForm, backgroundImage: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 mr-1">أقصى جولة لبداية الحساب</label>
                    <input type="number" placeholder="1" value={pvpForm.minStartedEvent}
                      className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-700 text-xs"
                      onChange={(e) => setPvpForm({ ...pvpForm, minStartedEvent: parseInt(e.target.value) })} />
                  </div>

                  {/* ── Matchups ── */}
                  <div className="pt-6 mt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                        المقارنات ⚔️ ({pvpForm.matchups.length})
                      </h3>
                      <button type="button" onClick={addMatchup}
                        className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-black px-4 py-2 rounded-xl hover:bg-purple-500 hover:text-white transition-all">
                        + إضافة
                      </button>
                    </div>

                    <div className="space-y-4">
                      {pvpForm.matchups.map((m, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-3 relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase">مقارنة #{idx + 1}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={m.isDouble}
                                  onChange={(e) => updateMatchup(idx, "isDouble", e.target.checked)}
                                  className="accent-purple-500" />
                                <span className="text-[10px] text-purple-400 font-bold">Double</span>
                              </label>
                              {pvpForm.matchups.length > 1 && (
                                <button type="button" onClick={() => removeMatchup(idx)}
                                  className="text-red-400 text-xs hover:text-red-300 font-black">✕</button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">اللاعب الأول</label>
                              <PlayerSearchInput 
                                placeholder="ابحث باسم اللاعب..."
                                value={m.p1_name}
                                onSelect={(p) => {
                                  updateMatchup(idx, "p1_id", p.id);
                                  updateMatchup(idx, "p1_name", p.name);
                                  updateMatchup(idx, "p1_photo", p.photo);
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">اللاعب الثاني</label>
                              <PlayerSearchInput 
                                placeholder="ابحث باسم اللاعب..."
                                value={m.p2_name}
                                onSelect={(p) => {
                                  updateMatchup(idx, "p2_id", p.id);
                                  updateMatchup(idx, "p2_name", p.name);
                                  updateMatchup(idx, "p2_photo", p.photo);
                                }}
                              />
                            </div>
                          </div>
                          
                          {(m.p1_name || m.p2_name) && (
                            <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-800 pt-4">
                              <div className="text-center">
                                {m.p1_photo ? <img src={m.p1_photo} className="w-10 h-10 object-cover mx-auto rounded-full bg-slate-800 border-2 border-slate-600" /> : <div className="w-10 h-10 mx-auto rounded-full bg-slate-700" />}
                                <div className="text-[10px] text-white font-bold mt-1 max-w-[80px] truncate">{m.p1_name || "-"}</div>
                              </div>
                              <span className="text-purple-500 font-black text-xs italic bg-purple-500/10 px-2 py-1 rounded-lg">VS</span>
                              <div className="text-center">
                                {m.p2_photo ? <img src={m.p2_photo} className="w-10 h-10 object-cover mx-auto rounded-full bg-slate-800 border-2 border-slate-600" /> : <div className="w-10 h-10 mx-auto rounded-full bg-slate-700" />}
                                <div className="text-[10px] text-white font-bold mt-1 max-w-[80px] truncate">{m.p2_name || "-"}</div>
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={createPvP.isPending}
                  className="w-full mt-10 bg-purple-500 text-white font-black py-5 rounded-2xl hover:bg-purple-400 transition-all shadow-xl shadow-purple-500/10 active:scale-95 disabled:opacity-50 text-lg uppercase italic tracking-tighter">
                  {createPvP.isPending ? "جاري الحفظ..." : "إطلاق المعركة ⚔️"}
                </button>
              </form>
            )}

          </div>

          {/* ══════════════════════════════════════════════
              RIGHT COLUMN: COMBINED LIST
          ══════════════════════════════════════════════ */}
          <div className="xl:col-span-7">
            <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 min-h-[700px] backdrop-blur-xl sticky top-8">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
                <span className="w-10 h-10 bg-slate-700/50 text-white rounded-full flex items-center justify-center text-sm italic">
                  🏟️
                </span>
                جميع التحديات والمعارك الجارية
              </h2>
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-gray-400 text-xs font-bold">اسحب الكروت لإعادة ترتيب الظهور في التطبيق.</p>
                {reorderMutation.isPending && <span className="text-yellow-500 text-xs font-black italic">جاري حفظ الترتيب...</span>}
              </div>

              {classicLoading || pvpLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-800 rounded-[32px] animate-pulse border border-slate-700" />
                  ))}
                </div>
              ) : (
                <>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="challenges" direction="vertical">
                      {(provided) => (
                        <div className="grid grid-cols-1 gap-6" ref={provided.innerRef} {...provided.droppableProps}>
                          {orderedChallenges?.map((c, index) => {
                            const isPvP = !!c.matchups; // Only PvP challenges have "matchups" field

                            return (
                              <Draggable key={c._id} draggableId={c._id} index={index}>
                                {(dragProvided, snapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className={`group bg-slate-800 p-6 rounded-[32px] border ${c.status === "finished" ? "border-yellow-500/30 opacity-80" : isPvP ? "border-purple-500/20" : "border-slate-700"} hover:${isPvP ? "border-purple-500/50" : "border-[#22c55e]/50"} transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative ${snapshot.isDragging ? `ring-2 ${isPvP ? "ring-purple-500/60" : "ring-[#22c55e]/60"} shadow-2xl` : ""}`}
                                  >
                                    {c.status === "finished" && (
                                      <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase italic">منتهي 🏆</div>
                                    )}
                                    <div className="flex items-center gap-6 w-full">
                                      <button type="button" className={`flex-none w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-gray-400 hover:text-white hover:${isPvP ? "border-purple-500/40" : "border-[#22c55e]/40"} transition-all cursor-grab`} {...dragProvided.dragHandleProps}>
                                        <GripIcon />
                                      </button>
                                      
                                      <div className={`w-24 h-24 rounded-3xl overflow-hidden border-2 flex items-center justify-center flex-shrink-0 ${isPvP ? "border-purple-500/20 bg-slate-900" : "border-slate-700 bg-slate-800"}`}>
                                        {c.image 
                                          ? <img src={c.image} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" alt="" />
                                          : isPvP ? <span className="text-3xl">⚔️</span> : <span className="text-3xl">🏆</span>
                                        }
                                      </div>

                                      <div className="flex-grow">
                                        <h4 className={`font-black text-xl text-white group-hover:${isPvP ? "text-purple-400" : "text-[#22c55e]"} transition-colors leading-none mb-2`}>{c.title}</h4>
                                        <p className="text-gray-400 text-xs mb-3 line-clamp-1">{c.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {isPvP ? (
                                            <>
                                              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-purple-400">GW {c.gw}</div>
                                              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-gray-300">{c.matchups?.length || 0} مقارنة</div>
                                            </>
                                          ) : (
                                            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-gray-300">الجولات: {c.startEvent} - {c.endEvent}</div>
                                          )}
                                          {c.prize && <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-[#22c55e]">{c.prize}</div>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                                      {c.status === "active" && !isPvP && (
                                        <button onClick={() => handleClose(c._id, c.title)} disabled={closeClassic.isPending}
                                          className="flex-1 md:flex-none px-6 py-5 bg-yellow-500/10 text-yellow-500 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all active:scale-90 border border-yellow-500/20 font-black text-xs uppercase italic">
                                          تتويج الأبطال
                                        </button>
                                      )}
                                      {c.status === "active" && isPvP && (
                                        <>
                                          <button onClick={() => handleClosePvP(c._id, c.title)} disabled={closePvP.isPending}
                                            className="flex-1 md:flex-none px-5 py-4 bg-yellow-500/10 text-yellow-500 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all active:scale-90 border border-yellow-500/20 font-black text-xs uppercase italic disabled:opacity-50">
                                            {closePvP.isPending ? "..." : "تتويج الأبطال"}
                                          </button>
                                          <button onClick={() => handleSyncPvP(c._id, c.title)} disabled={syncPvP.isPending}
                                            className="flex-none px-4 py-4 bg-purple-500/10 text-purple-400 rounded-2xl hover:bg-purple-500 hover:text-white transition-all active:scale-90 border border-purple-500/20 font-black text-xs uppercase italic disabled:opacity-50">
                                            {syncPvP.isPending ? "..." : "🔄"}
                                          </button>
                                        </>
                                      )}
                                      
                                      <button onClick={() => {
                                          if (window.confirm("🚨 هل أنت متأكد من الحذف؟")) {
                                            isPvP ? deletePvP.mutate(c._id) : deleteClassic.mutate(c._id);
                                          }
                                        }}
                                        className="flex-none p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20">
                                        <TrashIcon />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  {orderedChallenges?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                      <div className="text-6xl mb-4">🏟️</div>
                      <p className="text-xl font-black italic">الملعب خالي.. ابدأ بإضافة تحدياتك الأولى!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

// ─── SVG Icons ──────────────────────────────────────
const GripIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default AdminDashboard;
