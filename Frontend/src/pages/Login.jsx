import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { isAdmin, isFplLinked, WHATSAPP_SUPPORT } from '@/lib/challenge';
import { useLogin } from '@/hooks/useAuth';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { GoogleButton } from '@/components/layout/GoogleButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';

// Where to go after a session starts — shared with Register.
export const afterAuth = (user, from) => {
  if (isAdmin(user)) return '/admin';
  if (!isFplLinked(user)) return '/register';
  return from || '/home';
};

export default function Login() {
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname;
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const done = (user) => navigate(afterAuth(user, from), { replace: true });
  const submit = (e) => {
    e.preventDefault();
    login.mutate({ email: email.trim(), password }, { onSuccess: ({ data }) => done(data.user), onError: (err) => toast.error(errorMessage(err, 'بيانات الدخول غير صحيحة')) });
  };

  return (
    <>
      <Chrome back="/" title="تسجيل الدخول" />
      <Page>
        <h1 className="text-[28px] font-black leading-tight">أهلاً بك مجددًا</h1>
        <p className="mt-1 text-[13px] font-semibold text-muted">ادخل وكمّل تحدياتك من حيث توقفت.</p>

        <Card as="form" onSubmit={submit} className="mt-5">
          <Field label="البريد الإلكتروني">
            <Input type="email" dir="ltr" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
          </Field>
          <Field label="كلمة المرور" className="mt-3.5">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="mt-2 text-left">
            <Link to="/forgot" className="text-[12px] font-bold text-muted">نسيت كلمة المرور؟</Link>
          </div>
          <Button type="submit" size="lg" full className="mt-4" loading={login.isPending} disabled={!email || !password}>تسجيل الدخول</Button>
          <GoogleButton onDone={done} />
        </Card>

        <p className="mt-5 text-center text-[13px] font-semibold text-muted">
          ليس لديك حساب؟ <Link to="/register" className="font-black text-ink">إنشاء حساب</Link>
        </p>
        <p className="mt-6 text-center text-[12px] font-semibold text-muted">
          واجهتك مشكلة؟ <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer" className="font-black text-ink">تواصل معنا على واتساب</a>
        </p>
      </Page>
    </>
  );
}
