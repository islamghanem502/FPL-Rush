import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { readImage } from '@/lib/image';
import { fmt, fmtCompact, fmtRank } from '@/lib/format';
import { isFplLinked } from '@/lib/challenge';
import { useFplHistory, useLogout, useMe, useUpdateProfile, useUploadAvatar } from '@/hooks/useAuth';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import { NumberPanel } from '@/components/ui/Numbers';
import { Avatar, Segmented, Skeleton } from '@/components/ui/Misc';
import { copyText } from '@/components/challenge/InviteBox';

const WINDOW = 9;

// Bars, not a charting library: last 9 gameweeks, best in yellow, the current
// one marked with a red dot, average as a dashed line.
function GwChart({ history, currentEvent }) {
  const [mode, setMode] = useState('points');
  const rows = useMemo(() => (history?.current || []).slice(-WINDOW), [history]);
  if (!rows.length) return <p className="py-8 text-center text-[12.5px] font-semibold text-muted">لسه مفيش جولات مسجلة لهذا الموسم.</p>;

  const points = mode === 'points';
  const values = rows.map((r) => (points ? r.points : r.overall_rank));
  const max = Math.max(...values), min = Math.min(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  // Rank: lower is better, so flip it before sizing the bar.
  const size = (v) => (points ? v / (max || 1) : (max - v + (min || 1)) / (max || 1));
  const bestIndex = values.indexOf(points ? max : min);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[17px] font-black">أداء الجولات</div>
          <div className="text-[12.5px] font-semibold text-muted">{points ? 'نقاطك' : 'ترتيبك العام'} في آخر {fmt(rows.length)} جولات</div>
        </div>
        <Chip variant="gw">AVG {points ? avg : fmtCompact(avg)}</Chip>
      </div>
      <Segmented className="mt-3.5" value={mode} onChange={setMode} options={[{ value: 'points', label: 'النقاط لكل جولة' }, { value: 'rank', label: 'الترتيب العام' }]} />

      <div className="relative mt-5">
        {points && (
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#A89F8D]" style={{ bottom: `calc(${(avg / (max || 1)) * 150}px + 26px)` }}>
            <span className="num absolute left-0 -top-4 text-[9.5px] tracking-[.1em] text-muted">AVG {avg}</span>
          </div>
        )}
        <div className="flex h-[176px] items-end justify-between gap-1.5">
          {rows.map((row, i) => {
            const best = i === bestIndex;
            const current = Number(row.event) === Number(currentEvent);
            const v = values[i];
            return (
              <div key={row.event} className="flex h-full flex-1 flex-col items-center justify-end">
                {current && !best && <span className="mb-1 block h-2 w-2 rounded-full bg-action" />}
                {best && <span className="num mb-1 text-[11px]">{points ? v : fmtCompact(v)}</span>}
                <div className={cn('w-full rounded-t-[6px]', best ? 'bg-brand' : 'bg-ink')} style={{ height: `${Math.max(6, size(v) * 150)}px` }} />
                <div className={cn('num mt-2 text-[10.5px]', best || current ? 'text-ink' : 'text-muted')}>{row.event}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11.5px] font-bold">
        <span className="flex items-center gap-1.5"><span className="block h-2.5 w-2.5 rounded-[3px] bg-brand" />أفضل جولة</span>
        <span className="flex items-center gap-1.5"><span className="block h-2 w-2 rounded-full bg-action" />الجولة الحالية</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const linked = isFplLinked(me);
  const history = useFplHistory(linked);
  const upload = useUploadAvatar();
  const save = useUpdateProfile();
  const logout = useLogout();
  const fileRef = useRef(null);
  const [phone, setPhone] = useState(me?.phone || '');

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readImage(file, { maxSide: 800 });
      upload.mutate(image, { onSuccess: () => toast.success('تم تحديث صورتك'), onError: (err) => toast.error(errorMessage(err)) });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePhone = (e) => {
    e.preventDefault();
    save.mutate({ phone: phone.trim() }, { onSuccess: () => toast.success('تم حفظ رقم الهاتف'), onError: (err) => toast.error(errorMessage(err)) });
  };

  const shareCard = async () => {
    const text = `${me.teamName || 'فريقي'} — ${me.managerName || ''} · الترتيب العام ${fmtRank(me.overallRank)} · ${fmt(me.totalPoints)} نقطة على FPL Rush`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    copyText(text);
  };

  return (
    <>
      <Chrome user={false}>
        <div className="relative">
          <div className="chrome-disc pointer-events-none absolute -left-12 top-10 h-[150px] w-[150px] rounded-full" />
          <div className="relative flex items-start gap-3.5">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative shrink-0" aria-label="تغيير الصورة">
              <Avatar user={me} size={82} className={cn('ring-[3px] ring-brand', upload.isPending && 'opacity-50')} />
              <span className="num absolute -bottom-0.5 -left-0.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-ink bg-brand text-[13px] text-ink">+</span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="jersey truncate text-right text-[26px] leading-tight">{me.managerName || me.email?.split('@')[0]}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {me.isVerified ? <Chip variant="live">موثق</Chip> : linked ? <Chip variant="dark">غير موثق</Chip> : <Chip variant="dark">بدون حساب FPL</Chip>}
                {me.teamName && <span className="truncate text-[13.5px] font-bold text-brand">{me.teamName}</span>}
              </div>
            </div>
          </div>
          <div className="relative mt-3.5 flex flex-wrap gap-1.5">
            {me.fpl_id && <Chip variant="darkMono">FPL ID {me.fpl_id}</Chip>}
            {me.yearsActive > 0 && <Chip variant="dark">{fmt(me.yearsActive)} {me.yearsActive === 1 ? 'موسم' : 'مواسم'}</Chip>}
            {me.country && <Chip variant="dark">{me.country}</Chip>}
          </div>
          <div className="relative mt-3.5">
            {linked ? (
              <Button variant="secondary" dark full onClick={shareCard}><span className="block h-2.5 w-2.5 rounded-[3px] bg-brand" />مشاركة كارت المدرب</Button>
            ) : (
              <Button variant="secondary" dark full to="/register">ربط حساب FPL</Button>
            )}
          </div>
        </div>
      </Chrome>

      <Page>
        {linked && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <NumberPanel tone="paper" label="النقاط الإجمالية" value={Number(me.totalPoints || 0)} />
              <NumberPanel tone="ink" label="نقاط آخر جولة" value={Number(me.lastGwPoints || 0)} />
            </div>
            <Card className="mt-2.5 flex items-center justify-between gap-3 py-3.5">
              <span className="text-[13px] font-bold">الترتيب العام</span>
              <span className="num text-[23px]">{fmtRank(me.overallRank)}</span>
            </Card>

            <Card className="mt-4">
              {history.isPending ? <Skeleton className="h-[260px]" /> : <GwChart history={history.data} currentEvent={me.currentEvent} />}
            </Card>

            {!me.isVerified && (
              <Card className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-black">وثّق عضويتك</div>
                  <div className="text-[12.5px] font-semibold text-muted">انضم لدوري FPL Rush الرسمي لتأكيد هويتك.</div>
                </div>
                <Button variant="secondary" size="sm" to="/register">توثيق</Button>
              </Card>
            )}
          </>
        )}

        <Card as="form" onSubmit={savePhone} className="mt-4">
          <div className="text-[17px] font-black">بيانات التواصل والتسليم</div>
          <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">رقم هاتفك يُستخدم للتواصل وتسليم الجوائز عند الفوز فقط.</p>
          <Field label="رقم الهاتف" className="mt-4">
            <Input dir="ltr" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className="mono text-right" />
          </Field>
          <Field label="البريد الإلكتروني" hint="مرتبط بالحساب ولا يتغيّر" className="mt-3.5">
            <Input dir="ltr" value={me.email || ''} disabled className="mono text-right" />
          </Field>
          <Button type="submit" size="lg" full className="mt-4" loading={save.isPending} disabled={(me.phone || '') === phone.trim()}>حفظ البيانات</Button>
        </Card>

        <Button variant="tertiary" full className="mt-4 text-muted" onClick={() => { logout(); navigate('/'); }}>تسجيل الخروج</Button>
      </Page>
    </>
  );
}
