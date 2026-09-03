import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { authAPI } from '../services/api';
import { useUser } from '../hooks/useAuthQuery';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera, User, Phone, Globe, ShieldCheck,
  TrendingUp, Copy, AlertCircle, RefreshCw,
  Zap, BarChart2, Check, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

// ── Custom Chart Tooltip ──────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, isRank }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-right">
        <p className="text-xs text-gray-400 font-bold mb-1">الجولة: {label}</p>
        <p className="text-base font-black text-white">
          {isRank
            ? `#${Number(payload[0].value).toLocaleString()}`
            : `${payload[0].value} نقطة`}
        </p>
      </div>
    );
  }
  return null;
};

// ── Main Profile Component ────────────────────────────────────────────────────

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();
  const fileInputRef = useRef(null);

  // Editable Form State (Phone & Email only)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // UI States
  const [chartMode, setChartMode] = useState('points'); // 'points' | 'rank'
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // FPL Gameweek History
  const [fplHistory, setFplHistory] = useState({ current: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch FPL Gameweek History
  useEffect(() => {
    if (user?.fpl_id) {
      setHistoryLoading(true);
      authAPI.getFplHistory()
        .then(res => {
          if (res.data?.history) {
            setFplHistory(res.data.history);
          }
        })
        .catch(err => console.error('Failed to fetch FPL history:', err))
        .finally(() => setHistoryLoading(false));
    }
  }, [user?.fpl_id]);

  // Handle Avatar Click & Upload
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('حجم الصورة كبير جداً (الأقصى 5 ميجابايت)'); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      setIsUploadingAvatar(true);
      setError('');
      setSuccess('');
      try {
        await authAPI.uploadAvatar(reader.result);
        setSuccess('تم تحديث صورة البروفايل بنجاح! 📸');
        queryClient.invalidateQueries({ queryKey: ['authUser'] });
      } catch (err) {
        setError(err.response?.data?.message || 'فشل رفع الصورة');
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Phone
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setIsSaving(true);
    try {
      await authAPI.updateProfile({ phone });
      setSuccess('تم حفظ رقم الهاتف بنجاح! ✨');
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Profile Info
  const handleCopyProfile = () => {
    const text = `فريق: ${user?.teamName || 'FPL Rush'} | المدرب: ${user?.managerName || ''} | الترتيب العام: #${user?.overallRank?.toLocaleString() || '-'} ⚽`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // FPL History Stats Calculations
  const gwList = fplHistory.current || [];
  const chartData = gwList.map(gw => ({
    name: `ج${gw.event}`,
    points: gw.points,
    rank: gw.overall_rank,
  }));

  if (userLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-bold text-sm">جاري تحميل البروفايل...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 text-right">

        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        {/* ── Main Profile Header Card ────────────────────────────────────── */}
        <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">

          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#22c55e]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">

            {/* Avatar Circle with Upload Trigger */}
            <div className="relative group shrink-0">
              <div
                onClick={handleAvatarClick}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#22c55e]/40 group-hover:border-[#22c55e] transition-all duration-300 bg-slate-800 shadow-2xl flex items-center justify-center cursor-pointer relative"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.managerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-4xl font-black text-[#22c55e]">
                    {user?.managerName ? user.managerName.charAt(0).toUpperCase() : <User className="w-12 h-12 text-gray-500" />}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                  <Camera className="w-6 h-6 text-[#22c55e]" />
                  <span className="text-[10px] font-bold">رفع صورة</span>
                </div>
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-1 left-1 bg-[#22c55e] text-slate-950 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                title="تغيير الصورة"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* FPL User Identity Info */}
            <div className="flex-1 text-center sm:text-right min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">
                  {user?.managerName || 'مدرب الفانتزي'}
                </h1>
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> موثق
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> غير موثق
                  </span>
                )}
              </div>

              <p className="text-base font-extrabold text-[#22c55e] mb-3 flex items-center justify-center sm:justify-start gap-2">
                ⚽ {user?.teamName || 'فريق الفانتزي'}
              </p>

              {/* FPL Data Badges (Country from FPL API & FPL ID) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-300 font-bold mb-4">
                {user?.country && (
                  <span className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#22c55e]" />
                    {user.country}
                  </span>
                )}
                {user?.yearsActive && (
                  <span className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-[#22c55e] flex items-center gap-1.5">
                    <span>⏱️</span>
                    {user.yearsActive} {user.yearsActive === 1 ? 'موسم' : 'مواسم'}
                  </span>
                )}

                {user?.fpl_id && (
                  <span className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-gray-300">
                    FPL ID: {user.fpl_id}
                  </span>
                )}
              </div>

              <button
                onClick={handleCopyProfile}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-gray-300 px-4 py-2 rounded-xl border border-slate-700 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'تم النسخ!' : 'مشاركة الكارت'}
              </button>

            </div>

          </div>

          {/* Quick FPL Stats Counters */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold mb-1">النقاط الإجمالية</p>
              <p className="text-lg sm:text-2xl font-black text-white">{user?.totalPoints || 0}</p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold mb-1">الترتيب العام</p>
              <p className="text-lg sm:text-2xl font-black text-[#22c55e]">
                {user?.overallRank ? `#${user.overallRank.toLocaleString()}` : '-'}
              </p>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold mb-1">نقاط آخر جولة</p>
              <p className="text-lg sm:text-2xl font-black text-purple-400">{user?.lastGwPoints || 0}</p>
            </div>
          </div>

        </div>

        {/* Global Feedback Notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-xs sm:text-sm font-bold text-center mb-6 animate-pulse">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-2xl text-xs sm:text-sm font-bold text-center mb-6">
            {success}
          </div>
        )}

        {/* ── SECTION 1: GAMEWEEK JOURNEY & PERFORMANCE GRAPH ─────────────── */}
        <div className="space-y-8 mb-8">

          {/* Interactive Recharts Graph Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#22c55e]" />
                  أداء الجولات (Gameweek Journey)
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  رسم بياني يوضح مسيرتك ونقاطك في كل جولة
                </p>
              </div>

              {/* Chart Mode Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto gap-1">
                <button
                  onClick={() => setChartMode('points')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'points' ? 'bg-[#22c55e] text-slate-950' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  النقاط لكل جولة
                </button>
                <button
                  onClick={() => setChartMode('rank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'rank' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  الترتيب العام
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500 font-bold">جاري تحميل بيانات الفانتزي...</p>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'points' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="points" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#ptGrad)" dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} reversed />
                      <Tooltip content={<CustomTooltip isRank />} />
                      <Line type="monotone" dataKey="rank" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                <AlertCircle className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-sm font-bold text-gray-300 mb-1">لا توجد بيانات جولات متاحة حالياً</p>
                <p className="text-xs text-gray-500">تأكد من ربط حساب الـ FPL ID الخاص بك أولاً</p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: EDITABLE PHONE NUMBER FORM ─────────────────────────── */}
        <form onSubmit={handleSaveContact} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#22c55e]" />
              بيانات التواصل والتسليم
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              يرجى إضافة وتحديث رقم هاتفك لاستخدامه في التواصل وتسليم الجوائز عند الفوز 🎁
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone Input (Editable) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-300 mb-2">
                <Phone className="w-4 h-4 text-[#22c55e]" /> رقم الهاتف
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01x xxxx xxxx"
                dir="ltr"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-[#22c55e] transition-colors"
              />
            </div>

            {/* Email Display (Read-Only) */}
            <div>
              <label className="flex items-center justify-between text-xs font-extrabold text-gray-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#22c55e]" /> البريد الإلكتروني
                </span>
                <span className="text-[10px] text-gray-500 font-bold">(مرتبط بالحساب ولا يتغير)</span>
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                dir="ltr"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 text-gray-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#22c55e] text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-green-500/20 hover:bg-[#1da850] transition-all active:scale-95 disabled:opacity-50 text-base"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات ✨'}
          </button>
        </form>

      </div>
    </Layout>
  );
};

export default ProfilePage;
