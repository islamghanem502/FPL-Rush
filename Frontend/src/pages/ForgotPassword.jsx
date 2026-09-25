import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { useForgotPassword, useResetPassword, useVerifyResetCode } from '@/hooks/useAuth';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, CodeInput, Notice } from '@/components/ui/Field';

const TITLES = ['إعادة تعيين كلمة المرور', 'كود التحقق', 'كلمة المرور الجديدة'];

// Three requests, three small screens: email → 6-digit code → new password.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const request = useForgotPassword();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const fail = (err) => toast.error(errorMessage(err));

  const sendCode = (e) => {
    e.preventDefault();
    request.mutate(email.trim(), { onSuccess: ({ data }) => { toast.success(data.message || 'تم إرسال الكود'); setStep(2); }, onError: fail });
  };
  const checkCode = (e) => {
    e.preventDefault();
    verify.mutate({ email: email.trim(), code }, { onSuccess: () => setStep(3), onError: fail });
  };
  const savePassword = (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    reset.mutate({ email: email.trim(), code, password }, {
      onSuccess: () => { toast.success('تم تغيير كلمة المرور — سجّل دخولك'); navigate('/login', { replace: true }); },
      onError: fail,
    });
  };

  return (
    <>
      <Chrome back="/login" title={TITLES[step - 1]} />
      <Page>
        {step === 1 && (
          <Card as="form" onSubmit={sendCode}>
            <p className="text-[13px] font-semibold leading-relaxed text-muted">اكتب بريدك المسجّل وسنرسل لك كودًا من 6 أرقام صالحًا لمدة 15 دقيقة.</p>
            <Field label="البريد الإلكتروني" className="mt-4">
              <Input type="email" dir="ltr" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
            </Field>
            <Button type="submit" size="lg" full className="mt-4" loading={request.isPending} disabled={!email}>إرسال الكود</Button>
          </Card>
        )}

        {step === 2 && (
          <Card as="form" onSubmit={checkCode}>
            <Notice>أرسلنا الكود إلى <span className="mono font-black">{email}</span>. لو مش لاقيه، راجع مجلد الرسائل غير المرغوبة.</Notice>
            <Field label="الكود المكوّن من 6 أرقام" className="mt-4">
              <CodeInput inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" required />
            </Field>
            <Button type="submit" size="lg" full className="mt-4" loading={verify.isPending} disabled={code.length !== 6}>تأكيد الكود</Button>
            <Button variant="tertiary" full className="mt-1" onClick={() => setStep(1)}>إعادة إرسال كود جديد</Button>
          </Card>
        )}

        {step === 3 && (
          <Card as="form" onSubmit={savePassword}>
            <Notice>الكود صحيح — اختر كلمة مرور جديدة.</Notice>
            <Field label="كلمة المرور الجديدة" hint="6 أحرف على الأقل" className="mt-4">
              <Input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Field label="تأكيد كلمة المرور" className="mt-3.5">
              <Input type="password" autoComplete="new-password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </Field>
            <Button type="submit" size="lg" full className="mt-4" loading={reset.isPending} disabled={!password || !confirm}>حفظ كلمة المرور</Button>
          </Card>
        )}
      </Page>
    </>
  );
}
