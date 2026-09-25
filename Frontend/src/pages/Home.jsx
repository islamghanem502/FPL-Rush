import { Link } from 'react-router-dom';
import { useMe } from '@/hooks/useAuth';
import { useCurrentGw } from '@/hooks/useBonus';
import { useMyChallenges } from '@/hooks/useChallenges';
import { fmt, fmtRank, gwRange } from '@/lib/format';
import { isFplLinked, FPL_TEAM_URL } from '@/lib/challenge';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Card, Divider, SectionTitle } from '@/components/ui/Card';
import { NumberPanel } from '@/components/ui/Numbers';
import { BonusButton } from '@/components/ui/Misc';

// Not linked yet: the only thing to do is link. Keep it to one action.
function LinkFplPrompt() {
  return (
    <>
      <Chrome>
        <div className="text-[13px] font-bold opacity-80">أهلاً يا بطل</div>
        <div className="mt-1 text-[26px] font-black leading-tight">خطوة واحدة وتبدأ</div>
        <div className="mt-1.5 text-[14px] font-semibold opacity-75">اربط حساب FPL عشان نحسب نقاطك ونفتح لك التحديات.</div>
      </Chrome>
      <Page>
        <Card>
          <div className="text-[16px] font-black">اربط حساب FPL</div>
          <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-muted">نحتاج رقم فريقك (FPL ID) فقط — تلاقيه في رابط صفحة النقاط على موقع الفانتازي.</p>
          <Button size="lg" full className="mt-4" to="/register">ربط الحساب الآن</Button>
        </Card>
      </Page>
    </>
  );
}

export default function Home() {
  const { data: me } = useMe();
  const { data: gw } = useCurrentGw();
  const { data: mine } = useMyChallenges();

  if (!isFplLinked(me)) return <LinkFplPrompt />;

  const currentGw = gw || me.currentEvent;
  const privateCount = (mine?.owned?.length || 0) + (mine?.joined?.length || 0);
  const running = [...(mine?.owned || []), ...(mine?.joined || [])].filter((c) => c.status === 'active').slice(0, 3);

  return (
    <>
      <Chrome>
        <div className="text-[13px] font-bold opacity-80">أهلاً يا بطل</div>
        <div className="jersey mt-0.5 truncate text-right text-[34px] leading-[1.1] text-brand">{me.managerName || me.teamName || 'Manager'}</div>
        <div className="mt-1.5 text-[14px] font-semibold opacity-75">مستعد لتحديات الجولة الجديدة؟</div>
      </Chrome>

      <Page>
        <div className="grid grid-cols-2 gap-2.5">
          <NumberPanel tone="paper" label={`نقاط الجولة ${me.currentEvent || ''}`} value={Number(me.lastGwPoints || 0)} />
          <NumberPanel tone="ink" label="إجمالي النقاط" value={Number(me.totalPoints || 0)} />
        </div>

        <Card className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11.5px] font-bold text-muted">فريقك الحالي</div>
              <div className="truncate text-[21px] font-black leading-snug">{me.teamName || '—'}</div>
            </div>
            <Chip variant="mono">ID {me.fpl_id}</Chip>
          </div>
          <Divider />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <div className="text-[11.5px] font-bold text-muted">الترتيب العام</div>
              <div className="num text-[22px]">{fmtRank(me.overallRank)}</div>
            </div>
            <div className="h-9 w-px bg-line" />
            <div className="text-left">
              <div className="text-[11.5px] font-bold text-muted">انضم من</div>
              <div className="num text-[22px]">GW {me.startedEvent || 1}</div>
            </div>
          </div>
        </Card>

        <div className="mt-3.5">
          <Button size="lg" full to="/challenges">شوف تحديات GW {currentGw}</Button>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <Button variant="secondary" href={FPL_TEAM_URL}>تشكيلتي</Button>
            <Button variant="secondary" to="/challenges?f=mine">تحدياتي {privateCount ? `(${fmt(privateCount)})` : ''}</Button>
          </div>
        </div>

        {running.length > 0 && (
          <section className="mt-6">
            <SectionTitle aside={<Link to="/challenges?f=mine" className="font-bold text-ink">عرض الكل</Link>}>تحدياتك الجارية</SectionTitle>
            <div className="rounded-card bg-paper px-4 py-1.5">
              {running.map((c, i) => (
                <Link key={c._id} to={`/challenge/${c._id}`} className={`flex items-center justify-between gap-3 py-3.5 ${i < running.length - 1 ? 'border-b border-line' : ''}`}>
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-extrabold">{c.title}</div>
                    <div className="text-[11.5px] font-semibold text-muted">{fmt(c.participantCount || 0)} مشارك · {c.isOwner ? 'تحديك' : 'منضم'}</div>
                  </div>
                  <Chip variant="gw">{gwRange(c.startEvent, c.endEvent)}</Chip>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 flex justify-center">
          <BonusButton />
        </div>
      </Page>
    </>
  );
}
