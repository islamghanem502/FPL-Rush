import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { copyText } from '@/lib/clipboard';
import { hasToken } from '@/lib/token';
import { homeFor, isAdmin, isFplLinked, isVerified, LEAGUE_CODE, WHATSAPP_SUPPORT } from '@/lib/challenge';
import { useLinkFpl, useLogout, useMe, useRegister, useVerifyLeague } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { AuthShell, AuthTitle } from '@/components/auth/AuthShell';
import { PhoneCallout } from '@/components/landing/PhoneCallout';
import { GoogleButton, OrEmail } from '@/components/site/GoogleButton';
import { Button, TextLink } from '@/components/kit/Button';
import { Field, Input, PasswordInput } from '@/components/kit/Field';
import { Steps } from '@/components/kit/Steps';
import { Panel } from '@/components/kit/Panel';

const STEPS = ['الحساب', 'ربط فريقك', 'التوثيق'];
const FPL_SITE = 'https://fantasy.premierleague.com/';

// Step 1 — email + password
function CreateAccount() {
  const register = useRegister();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('كلمة المرور 6 أحرف على الأقل');
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    register.mutate({ email: email.trim(), password }, { onError: (err) => toast.error(errorMessage(err)) });
  };

  return (
    <>
      <AuthTitle title="اعمل حسابك" sub="تلات خطوات: حسابك، ربط فريقك من الفانتازي، وتوثيقه — وبعدها تدخل التحديات." />
      <GoogleButton text="signup_with" onDone={(user) => navigate(homeFor(user), { replace: true })} />
      <OrEmail />
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field id="email" label="البريد الإلكتروني">
          <Input id="email" type="email" dir="ltr" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" />
        </Field>
        <Field id="password" label="كلمة المرور" hint="6 أحرف على الأقل">
          <PasswordInput id="password" autoComplete="new-password" required minLength={6} visible={visible} onVisible={setVisible} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field id="confirm" label="أكّد كلمة المرور">
          <PasswordInput id="confirm" autoComplete="new-password" required toggle={false} visible={visible} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" size="lg" knob full className="mt-2" loading={register.isPending} disabled={!email || !password || !confirm}>
          التالي — ربط فريقك
        </Button>
      </form>
    </>
  );
}

// Where the id lives: the Points page URL, with the id lit up.
function WhereIsMyId({ gw }) {
  return (
    <div className="rounded-box bg-night-2 p-4 ring-1 ring-white/[.06]">
      <div className="font-display text-[14px] font-semibold">فين ألاقي الرقم؟</div>
      <p className="mt-1.5 text-[13.5px] leading-[1.8] text-white/60">
        افتح موقع الفانتازي وادخل على صفحة <b className="font-semibold text-white">Points</b> — الرقم اللي في الرابط هو رقم فريقك.
      </p>
      <div dir="ltr" className="mt-3 truncate rounded-full bg-night px-4 py-2.5 text-[12px] text-white/45 md:text-[13px]">
        fantasy.premierleague.com/entry/
        <span className="rounded-md bg-pitch px-1.5 py-0.5 font-display font-bold text-edge">1234567</span>
        /event/{gw || 1}
      </div>
    </div>
  );
}

// Step 2 — link the FPL team id
function LinkFpl({ me, gw, onLinked }) {
  const link = useLinkFpl();
  const [id, setId] = useState(me?.fpl_id ? String(me.fpl_id) : '');
  const submit = (e) => {
    e.preventDefault();
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) return toast.error('اكتب رقم فريق صحيح');
    link.mutate(n, {
      onSuccess: ({ data }) => { toast.success(`تم ربط ${data.user?.teamName || 'فريقك'}`); onLinked?.(); },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <>
      <AuthTitle title="اربط فريقك من الفانتازي" sub="اكتب رقم فريقك (FPL ID) — هنجيب اسم الفريق والنقاط والترتيب من اللعبة نفسها." />
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field id="fpl-id" label="رقم فريقك في FPL">
          <Input
            id="fpl-id"
            dir="ltr"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            required
            value={id}
            onChange={(e) => setId(e.target.value.replace(/\D/g, ''))}
            placeholder="1234567"
            className="h-14 text-center font-display text-[24px] font-bold tracking-[.12em] tabular-nums md:h-16 md:text-[28px]"
          />
        </Field>
        <WhereIsMyId gw={gw} />
        <Button type="submit" size="lg" knob full loading={link.isPending} disabled={!id}>اربط فريقي</Button>
      </form>
      {me?.fpl_id && me.isVerified && (
        <p className="text-[13.5px] leading-relaxed text-white/60">
          حسابك موثّق برقم فريق تاني — لتغييره <TextLink href={WHATSAPP_SUPPORT} className="text-[13.5px]">كلّم الدعم</TextLink>.
        </p>
      )}
      <p className="text-center">
        <TextLink href={FPL_SITE}>افتح موقع الفانتازي ↗</TextLink>
      </p>
    </>
  );
}

// Step 3 — join the official league and verify. Mandatory: the dashboard
// stays closed until it passes (see RequireAuth).
function VerifyLeague({ me, from, onEdit }) {
  const verify = useVerifyLeague();
  const navigate = useNavigate();
  const run = () =>
    verify.mutate(undefined, {
      onSuccess: () => { toast.success('تم التوثيق — أهلاً بيك في FPL Rush'); navigate(from || '/home', { replace: true }); },
      onError: (err) => toast.error(errorMessage(err, 'لسه ملقيناش فريقك في الدوري')),
    });

  return (
    <>
      <AuthTitle title="آخر خطوة: وثّق فريقك" sub="انضم لدوري FPL Rush الرسمي بالكود — التوثيق بيأكد إن الفريق فريقك، ومن غيره مش هتقدر تدخل التحديات." />

      <Panel className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <div className="truncate font-display text-[17px] font-bold md:text-[19px]">{me.teamName || 'فريقك'}</div>
          <div className="mt-0.5 truncate text-[13px] text-white/55">
            {me.managerName} · <span dir="ltr">ID {me.fpl_id}</span>
          </div>
        </div>
        <TextLink onClick={onEdit} className="shrink-0 text-[13px]">تعديل</TextLink>
      </Panel>

      <div>
        <div className="font-display text-[14px] font-semibold">كود الدوري</div>
        <div className="mt-2 flex items-center gap-3 rounded-full bg-night-2 p-2 ps-6 ring-1 ring-white/[.06]">
          <span dir="ltr" className="flex-1 font-display text-[21px] font-extrabold tracking-[.16em] text-pitch md:text-[26px]">{LEAGUE_CODE}</span>
          <Button variant="secondary" size="sm" onClick={() => copyText(LEAGUE_CODE)}>انسخ</Button>
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.8] text-white/60">
          انسخ الكود وانضم بيه من صفحة الدوريات في الفانتازي، وبعدها ارجع هنا واضغط تحقق.{' '}
          <TextLink href="https://fantasy.premierleague.com/leagues/join/private" className="text-[13.5px]">صفحة الانضمام ↗</TextLink>
        </p>
      </div>

      <Button size="lg" knob full loading={verify.isPending} onClick={run}>انضممت — اتحقق دلوقتي</Button>
      <p className="text-center text-[14px] text-white/55">
        في مشكلة في التوثيق؟ <TextLink href={WHATSAPP_SUPPORT} className="text-[14px]">كلّمنا على واتساب</TextLink>
      </p>
    </>
  );
}

export default function Register() {
  const { data: me, isPending } = useMe();
  const { data: gw } = useCurrentGw();
  const navigate = useNavigate();
  const logout = useLogout();
  const from = useLocation().state?.from?.pathname; // e.g. an invite link that sent them here
  const signedIn = hasToken() && Boolean(me);
  const [editing, setEditing] = useState(false);

  if (hasToken() && isPending) return <AuthShell />;
  if (signedIn && isAdmin(me)) return <Navigate to="/admin" replace />;
  if (signedIn && isVerified(me) && !editing) return <Navigate to={from || '/home'} replace />;

  const step = !signedIn ? 1 : !isFplLinked(me) || editing ? 2 : 3;
  // The phone (the FPL app) only where it explains something: linking the team.
  const aside = step === 1 ? null : <PhoneCallout gw={gw} className="mt-6" />;

  return (
    <AuthShell
      stepKey={step}
      end={
        signedIn ? (
          // Unverified users can't reach the dashboard, so the way out lives here.
          <TextLink onClick={() => { logout(); navigate('/', { replace: true }); }} className="text-[13.5px]">خروج</TextLink>
        ) : (
          <Button variant="secondary" size="sm" to="/login">دخول</Button>
        )
      }
      aside={aside}
    >
      <Steps steps={STEPS} current={step} />
      {step === 1 && <CreateAccount />}
      {step === 2 && <LinkFpl me={me} gw={gw} onLinked={() => setEditing(false)} />}
      {step === 3 && <VerifyLeague me={me} from={from} onEdit={() => setEditing(true)} />}
    </AuthShell>
  );
}
