import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { challengeState } from '@/lib/challenge';
import { useCurrentGw } from '@/hooks/useBonus';
import { useMyChallenges, usePublicChallenges } from '@/hooks/useChallenges';
import { Chrome } from '@/components/layout/Chrome';
import { Page } from '@/components/layout/Shell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Empty, Skeleton } from '@/components/ui/Misc';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';

const FILTERS = [
  ['all', 'الكل'],
  ['live', 'نشط'],
  ['upcoming', 'يبدأ قريبًا'],
  ['finished', 'منتهي'],
  ['mine', 'تحدياتي'],
];

export default function Challenges() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = params.get('f') || 'all';
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');

  const { data: gw } = useCurrentGw();
  const publicQuery = usePublicChallenges();
  const mineQuery = useMyChallenges();

  // Public first (admin order), then my private ones; each tagged with a role.
  const all = useMemo(() => {
    const owned = (mineQuery.data?.owned || []).map((c) => ({ ...c, role: 'owner' }));
    const joined = (mineQuery.data?.joined || []).map((c) => ({ ...c, role: 'joined' }));
    const mine = [...owned, ...joined];
    const list = [...(publicQuery.data || []), ...mine];
    const order = { live: 0, upcoming: 1, closing: 2, finished: 3, cancelled: 4 };
    return list
      .map((c) => ({ ...c, state: challengeState(c, gw) }))
      .sort((a, b) => order[a.state] - order[b.state]);
  }, [publicQuery.data, mineQuery.data, gw]);

  const counts = useMemo(
    () => ({
      live: all.filter((c) => c.state === 'live').length,
      mine: all.filter((c) => c.role).length,
    }),
    [all],
  );

  const visible = all.filter((c) => {
    if (filter === 'mine') { if (!c.role) return false; }
    else if (filter !== 'all' && c.state !== filter) return false;
    return c.title.toLowerCase().includes(search.trim().toLowerCase());
  });

  const loading = publicQuery.isPending || mineQuery.isPending;
  const enterCode = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) navigate(`/join/${encodeURIComponent(clean)}`);
  };

  return (
    <>
      <Chrome title="التحديات">
        <div className="flex items-center gap-2.5 rounded-full bg-canvas px-4 py-2.5 text-ink">
          <span className="block h-[13px] w-[13px] shrink-0 rounded-full border-2 border-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن تحدي…"
            className="w-full bg-transparent text-[14px] font-semibold outline-none"
          />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setParams(key === 'all' ? {} : { f: key })}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] whitespace-nowrap',
                filter === key ? 'bg-brand font-black text-ink' : 'border-[1.5px] border-canvas/50 font-bold text-canvas',
              )}
            >
              {label}
              {key === 'live' && counts.live > 0 && ` (${counts.live})`}
              {key === 'mine' && counts.mine > 0 && ` (${counts.mine})`}
            </button>
          ))}
        </div>
      </Chrome>

      <Page wide>
        {/* Create + invite code — the two ways in that aren't the list */}
        <div className="grid gap-2.5 md:grid-cols-2">
          <Button variant="secondary" full to="/challenges/new">+ إنشاء تحدي خاص</Button>
          <form onSubmit={enterCode} className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="عندك كود دعوة؟" dir="ltr" className="num text-center text-[15px] tracking-[.1em] py-3" autoComplete="off" />
            <Button variant="secondary" disabled={!code.trim()} onClick={enterCode}>دخول</Button>
          </form>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[214px]" />)}
          {!loading && visible.map((c, i) => (
            <ChallengeCard key={`${c.role || 'public'}-${c._id}`} challenge={c} currentGw={gw} role={c.role} featured={i === 0} />
          ))}
        </div>

        {!loading && !visible.length && (
          <Empty
            className="mt-4"
            number={filter === 'mine' ? '00' : '0'}
            title={filter === 'mine' ? 'لسه ما دخلت أي تحدي خاص' : search ? 'مفيش تحدي بالاسم ده' : 'مفيش تحديات هنا حاليًا'}
            hint={filter === 'mine' ? 'أنشئ تحديك أو ادخل بكود دعوة من صاحبك' : counts.live ? `فيه ${counts.live} تحدي نشط الآن` : 'التحديات الجديدة تظهر هنا فور نشرها'}
            action={filter === 'mine' ? <Button size="md" to="/challenges/new">إنشاء تحدي</Button> : filter !== 'all' ? <Button variant="secondary" onClick={() => setParams({})}>شوف كل التحديات</Button> : null}
          />
        )}
      </Page>
    </>
  );
}
