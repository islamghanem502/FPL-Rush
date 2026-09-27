import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { useForgotPassword, useResetPassword, useVerifyResetCode } from '@/hooks/useAuth';
import { AuthShell, AuthTitle } from '@/components/auth/AuthShell';
import { Button, TextLink } from '@/components/kit/Button';
import { Field, Input, OtpInput, PasswordInput } from '@/components/kit/Field';
import { Steps } from '@/components/kit/Steps';

const STEPS = ['بريدك', 'الكود', 'كلمة جديدة'];
const CODE_LIFE = 15 * 60 * 1000; // the backend's passwordResetExpires

// How long the emailed code stays valid — a draining bar, alert at the end.
function CodeClock({ sentAt, onResend, resending }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, sentAt + CODE_LIFE - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const expired = left === 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
        <span className={expired ? 'text-alert' : 'text-white/60'}>{expired ? 'الكود انتهى' : 'الكود صالح لمدة'}</span>
        {expired ? (
          <TextLink onClick={onResend} className="text-[13.5px]">{resending ? 'بنبعت…' : 'ابعت كود جديد'}</TextLink>
        ) : (
          <span dir="ltr" className="font-display font-bold tabular-nums">{mm}:{ss}</span>
        )}
      </div>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
        <span
          className={cn('block h-full origin-right rounded-full transition-transform duration-1000 ease-linear', left < 60000 ? 'bg-alert' : 'bg-pitch')}
          style={{ transform: `scaleX(${left / CODE_LIFE})` }}
        />
      </span>
    </div>
  );
}

// Three requests, three small screens: email → 6-digit code → new password.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const request = useForgotPassword();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [sentAt, setSentAt] = useState(0);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);

  const fail = (err) => toast.error(errorMessage(err));

  const send = () =>
    request.mutate(email.trim(), {
      onSuccess: () => { setSentAt(Date.now()); setCode(''); setStep(2); toast.success('بعتنالك الكود على بريدك'); },
      onError: fail,
    });
  const sendCode = (e) => { e.preventDefault(); send(); };
  const checkCode = (e) => {
    e.preventDefault();
    verify.mutate({ email: email.trim(), code }, { onSuccess: () => setStep(3), onError: fail });
  };
  const savePassword = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('كلمة المرور 6 أحرف على الأقل');
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    reset.mutate({ email: email.trim(), code, password }, {
      onSuccess: () => { toast.success('اتغيرت كلمة المرور — سجّل دخولك'); navigate('/login', { replace: true }); },
      onError: fail,
    });
  };

  return (
    <AuthShell stepKey={step} end={<Button variant="secondary" size="sm" to="/login">رجوع للدخول</Button>}>
      <Steps steps={STEPS} current={step} />

      {step === 1 && (
        <>
          <AuthTitle title="نسيت كلمة المرور؟" sub="اكتب بريدك المسجّل وهنبعتلك كود من 6 أرقام صالح لمدة 15 دقيقة." />
          <form onSubmit={sendCode} className="flex flex-col gap-5">
            <Field id="email" label="البريد الإلكتروني">
              <Input id="email" type="email" dir="ltr" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
            </Field>
            <Button type="submit" size="lg" knob full loading={request.isPending} disabled={!email}>ابعت الكود</Button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <AuthTitle
            title="اكتب الكود"
            sub={<>بعتنا الكود على <span dir="ltr" className="font-semibold text-white">{email}</span>. مش لاقيه؟ بص في الرسائل غير المرغوبة.</>}
          />
          <form onSubmit={checkCode} className="flex flex-col gap-5">
            <Field id="code" label="الكود المكوّن من 6 أرقام">
              <OtpInput id="code" value={code} onChange={setCode} autoFocus aria-label="الكود المكوّن من 6 أرقام" />
            </Field>
            <CodeClock sentAt={sentAt} onResend={send} resending={request.isPending} />
            <Button type="submit" size="lg" knob full loading={verify.isPending} disabled={code.length !== 6}>تأكيد الكود</Button>
          </form>
          <p className="text-center">
            <TextLink onClick={() => setStep(1)}>غيّر البريد الإلكتروني</TextLink>
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <AuthTitle title="كلمة مرور جديدة" sub="الكود صحيح — اختار كلمة مرور جديدة لحسابك." />
          <form onSubmit={savePassword} className="flex flex-col gap-5">
            <Field id="new-password" label="كلمة المرور الجديدة" hint="6 أحرف على الأقل">
              <PasswordInput id="new-password" autoComplete="new-password" required minLength={6} visible={visible} onVisible={setVisible} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Field id="confirm" label="أكّدها">
              <PasswordInput id="confirm" autoComplete="new-password" required toggle={false} visible={visible} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </Field>
            <Button type="submit" size="lg" knob full loading={reset.isPending} disabled={!password || !confirm}>احفظ كلمة المرور</Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
