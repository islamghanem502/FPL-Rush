import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { authAPI } from '../services/api';
import { useUser } from '../hooks/useAuthQuery';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useUser();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state when user is loaded
  React.useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email && !phone) {
      setError('يجب إدخال إيميل أو رقم هاتف على الأقل');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.saveContact({ 
        email: email || undefined, 
        phone: phone || undefined 
      });
      setSuccess('تم الحفظ بنجاح! شكراً لك.');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-12 md:py-20 text-right">
        
        <h1 className="text-3xl font-black text-white mb-8">الملف الشخصي 👤</h1>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">المدرب</p>
              <p className="text-xl font-black text-white">{user?.managerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">الفريق</p>
              <p className="text-lg font-black text-[#22c55e]">{user?.teamName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">FPL ID</p>
              <p className="text-lg font-bold text-gray-300">{user?.fpl_id}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-white mb-2">بيانات التواصل 📞</h2>
            <p className="text-xs text-gray-400 font-medium">نحتاجها للتواصل معك في حال فوزك بالجوائز</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-bold text-center animate-pulse">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl text-sm font-bold text-center">{success}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">البريد الإلكتروني (Email)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">رقم الهاتف (اختياري)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01x xxxx xxxx"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || (!email && !phone)}
            className="w-full bg-[#22c55e] text-slate-900 font-black py-4 rounded-xl shadow-lg hover:bg-[#1da850] transition-colors disabled:opacity-50"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        </form>

      </div>
    </Layout>
  );
};

export default ProfilePage;
