import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { hasToken } from '@/lib/token';
import { isAdmin, isFplLinked, LEAGUE_CODE, WHATSAPP_SUPPORT } from '@/lib/challenge';
import { useLinkFpl, useMe, useRegister, useVerifyLeague } from '@/hooks/useAuth';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { GoogleButton } from '@/components/layout/GoogleButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, CodeInput, Notice } from '@/components/ui/Field';
import { copyText } from '@/components/challenge/InviteBox';

const STEPS = ['الحساب', 'FPL ID', 'التوثيق'];

function StepPills({ step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <div
            key={label}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-[12.5px]',
              step === n ? 'bg-brand font-black text-ink' : step > n ? 'bg-live font-black text-ink' : 'border-[1.5px] border-canvas/45 font-bold text-canvas',
            )}
          >
            <span className="num text-[13px]">{n}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Step 1 — email + password
function CreateAccount() {
  const register = useRegister();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    if (password.length < 6) return toast.error('كلمة المرور 6 أحرف على الأقل');
    register.mutate({ email: email.trim(), password }, { onError: (err) => toast.error(errorMessage(err)) });
  };

  return (
    <Card as="form" onSubmit={submit}>
      <Field label="البريد الإلكتروني">
        <Input type="email" dir="ltr" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
      </Field>
      <Field label="كلمة المرور" hint="6 أحرف على الأقل" className="mt-3.5">
        <div className="relative">
          <Input type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-16" />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-muted">{show ? 'إخفاء' : 'إظهار'}</button>
        </div>
      </Field>
      <Field label="تأكيد كلمة المرور" className="mt-3.5">
        <Input type={show ? 'text' : 'password'} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
      </Field>
      <Button type="submit" size="lg" full className="mt-4" loading={register.isPending} disabled={!email || !password || !confirm}>التالي — ربط FPL</Button>
      <GoogleButton text="signup_with" onDone={(user) => navigate(isAdmin(user) ? '/admin' : isFplLinked(user) ? '/home' : '/register', { replace: true })} />
      <p className="mt-4 text-center text-[13px] font-semibold text-muted">
        لديك حساب؟ <Link to="/login" className="font-black text-ink">تسجيل الدخول</Link>
      </p>
    </Card>
  );
}

// Step 2 — link the FPL team id
function LinkFpl({ me, onLinked }) {
  const link = useLinkFpl();
  const [id, setId] = useState(me?.fpl_id || '');
  const submit = (e) => {
    e.preventDefault();
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) return toast.error('اكتب رقم FPL ID صحيح');
    link.mutate(n, { onSuccess: ({ data }) => { toast.success(`تم ربط ${data.user?.teamName || 'فريقك'}`); onLinked?.(); }, onError: (err) => toast.error(errorMessage(err)) });
  };
  return (
    <Card as="form" onSubmit={submit}>
      <div className="text-[16px] font-black">رقم فريقك في FPL</div>
      <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">نجلب اسم الفريق والنقاط والترتيب تلقائيًا من موقع الفانتازي.</p>
      <CodeInput className="mt-4" inputMode="numeric" pattern="[0-9]*" value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ''))} placeholder="1234567" required />
      <div className="mt-4 rounded-chip bg-canvas px-3.5 py-3 text-[12.5px] font-semibold leading-[1.9]">
        <div className="font-black">إزاي تلاقي الـ ID؟</div>
        1. افتح موقع الفانتازي وادخل على <b className="font-black">Points</b>
        <br />2. الرقم اللي في رابط الصفحة هو الـ ID بتاعك
        <br /><span className="mono text-[11px] text-muted">fantasy.premierleague.com/entry/<b className="text-ink">1234567</b>/event/3</span>
      </div>
      <Button type="submit" size="lg" full className="mt-4" loading={link.isPending} disabled={!id}>التالي — التوثيق</Button>
      <Button variant="tertiary" size="sm" full className="mt-1" href="https://fantasy.premierleague.com/">فتح موقع الفانتازي ↗</Button>
    </Card>
  );
}

// Step 3 — join the official league and verify (optional for now)
function VerifyLeague({ me, onEdit }) {
  const verify = useVerifyLeague();
  const navigate = useNavigate();
  const run = () =>
    verify.mutate(undefined, {
      onSuccess: () => { toast.success('تم التوثيق — أهلاً بك في FPL Rush'); navigate('/home', { replace: true }); },
      onError: (err) => toast.error(errorMessage(err, 'لم نجد فريقك في الدوري بعد')),
    });

  return (
    <>
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[16px] font-black">{me.teamName || 'فريقك'}</div>
          <div className="text-[12px] font-semibold text-muted">{me.managerName} · <span className="mono">ID {me.fpl_id}</span></div>
        </div>
        <Button variant="tertiary" size="sm" onClick={onEdit}>تعديل</Button>
      </Card>

      <Card className="mt-3">
        <div className="text-[16px] font-black">انضم لدوري FPL Rush الرسمي</div>
        <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">التوثيق يؤكد إن الفريق بتاعك. انضم بالكود ثم اضغط تحقق.</p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-chip bg-canvas px-4 py-3">
          <span className="text-[12.5px] font-bold">كود الدوري</span>
          <button type="button" onClick={() => copyText(LEAGUE_CODE)} className="jersey text-[22px] tracking-[.1em]">{LEAGUE_CODE}</button>
        </div>
        <Button variant="secondary" full className="mt-2.5" onClick={() => copyText(LEAGUE_CODE)}>نسخ الكود</Button>
        <Button variant="tertiary" size="sm" full className="mt-1" href="https://fantasy.premierleague.com/leagues/join/private">الذهاب لصفحة الانضمام في الفانتازي ↗</Button>
        <Button size="lg" full className="mt-4" loading={verify.isPending} onClick={run}>انضممت — تحقق الآن</Button>
        <Button variant="tertiary" full className="mt-1" to="/home">الدخول بدون توثيق الآن</Button>
      </Card>
    </>
  );
}

export default function Register() {
  const { data: me, isPending } = useMe();
  const signedIn = hasToken() && Boolean(me);
  const [editing, setEditing] = useState(false);

  if (hasToken() && isPending) return <><Chrome back="/" title="إنشاء حساب" /><div className="p-10" /></>;
  if (signedIn && isAdmin(me)) return <Navigate to="/admin" replace />;
  if (signedIn && me.isVerified && !editing) return <Navigate to="/home" replace />;

  const step = !signedIn ? 1 : !isFplLinked(me) || editing ? 2 : 3;

  return (
    <>
      <Chrome back={signedIn ? '/home' : '/'} title={signedIn ? 'إكمال الحساب' : 'إنشاء حساب'}>
        <StepPills step={step} />
        <div className="mt-2.5 text-[12px] font-semibold opacity-70">
          {step === 1 && 'ثلاث خطوات قصيرة وتدخل ملعب التحديات.'}
          {step === 2 && 'اربط فريقك عشان نحسب نقاطك ونفتح لك التحديات.'}
          {step === 3 && 'خطوة أخيرة اختيارية تؤكد إن الفريق بتاعك.'}
        </div>
      </Chrome>
      <Page>
        {step === 1 && <CreateAccount />}
        {step === 2 && <LinkFpl me={me} onLinked={() => setEditing(false)} />}
        {step === 3 && <VerifyLeague me={me} onEdit={() => setEditing(true)} />}
        {step === 2 && me?.fpl_id && me.isVerified && (
          <Notice className="mt-3">حسابك موثق بـ FPL ID آخر — لتغييره تواصل مع الدعم.</Notice>
        )}
        {signedIn && (
          <p className="mt-6 text-center text-[12px] font-semibold text-muted">
            محتاج مساعدة؟ <a href={WHATSAPP_SUPPORT} target="_blank" rel="noreferrer" className="font-black text-ink">الدعم عبر واتساب</a>
          </p>
        )}
      </Page>
    </>
  );
}
