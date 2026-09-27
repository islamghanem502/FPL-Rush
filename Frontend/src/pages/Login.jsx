import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { homeFor, WHATSAPP_SUPPORT } from '@/lib/challenge';
import { useLogin } from '@/hooks/useAuth';
import { AuthShell, AuthTitle } from '@/components/auth/AuthShell';
import { GoogleButton, OrEmail } from '@/components/site/GoogleButton';
import { Button, TextLink } from '@/components/kit/Button';
import { Field, Input, PasswordInput } from '@/components/kit/Field';

export default function Login() {
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Unverified users go to onboarding first — still carrying where they were
  // headed (an invite link), so verifying lands them there.
  const done = (user) => navigate(homeFor(user, from?.pathname), { replace: true, state: from ? { from } : undefined });
  const submit = (e) => {
    e.preventDefault();
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: ({ data }) => done(data.user), onError: (err) => toast.error(errorMessage(err, 'بيانات الدخول غير صحيحة')) },
    );
  };

  return (
    <AuthShell
      end={<Button variant="secondary" size="sm" to="/register">اعمل حساب</Button>}
    >
      <AuthTitle title="أهلاً بيك تاني" sub="ادخل وكمّل تحدياتك من مكان ما وقفت." />
      <GoogleButton onDone={done} />
      <OrEmail />

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field id="email" label="البريد الإلكتروني">
          <Input id="email" type="email" dir="ltr" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
        </Field>
        <Field id="password" label="كلمة المرور" aside={<TextLink to="/forgot" className="text-[13px]">نسيتها؟</TextLink>}>
          <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" size="lg" knob full className="mt-2" loading={login.isPending} disabled={!email || !password}>دخول</Button>
      </form>

      <p className="text-center text-[14px] text-white/55">
        واجهتك مشكلة؟ <TextLink href={WHATSAPP_SUPPORT}>كلمنا على واتساب</TextLink>
      </p>
    </AuthShell>
  );
}
