import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { challengeState } from '@/lib/challenge';
import { useCurrentGw } from '@/hooks/useBonus';
import { useMyChallenges, usePublicChallenges } from '@/hooks/useChallenges';
import { AppPage } from '@/components/layout/AppPage';
import { Button, IconButton } from '@/components/kit/Button';
import { FilterChips } from '@/components/kit/Choice';
import { Empty, Skeleton } from '@/components/kit/Feedback';
import { Gw } from '@/components/kit/Gw';
import { PageTitle } from '@/components/kit/Heading';
import { ArrowIcon, PlusIcon, SearchIcon } from '@/components/kit/icons';
import { EmptyNet } from '@/components/art/EmptyNet';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';

const FILTERS = [
  ['all', 'الكل'],
  ['live', 'نشط'],
  ['upcoming', 'يبدأ قريبًا'],
  ['finished', 'منتهي'],
  ['mine', 'تحدياتي'],
];

// "Have a code?" — a ticket stub you type into, with the send knob.
function CodeEntry() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const enterCode = (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) navigate(`/join/${encodeURIComponent(clean)}`);
  };
  return (
    <form onSubmit={enterCode} className="ticket flex items-center gap-3 rounded-box bg-night-2 py-3 pe-3 ps-6 ring-1 ring-white/[.06]" style={{ '--cut': '50%', '--notch': '11px' }}>
      <label htmlFor="invite-code" className="shrink-0 font-display text-[13.5px] font-semibold leading-tight text-white/60">
        عندك كود
        <br />
        دعوة؟
      </label>
      <input
        id="invite-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="ABC123"
        dir="ltr"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="sunk h-12 min-w-0 flex-1 rounded-full px-4 text-center font-display text-[17px] font-bold uppercase tracking-[.16em] text-white outline-none placeholder:text-white/20"
      />
      <IconButton type="submit" label="ادخل بالكود" size={48} disabled={!code.trim()} className="text-edge!">
        <ArrowIcon size={19} />
      </IconButton>
    </form>
  );
}

export default function Challenges() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('f') || 'all';
  const [search, setSearch] = useState('');

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

  return (
    <AppPage>
      <PageTitle
        kicker={<>تحديات <Gw n={gw} /></>}
        title="التحديات"
        sub={counts.live ? `فيه ${counts.live} تحدي شغال دلوقتي — اختار وادخل.` : 'تحديات عامة للكل، وتحديات خاصة بينك وبين أصحابك.'}
        aside={
          <Button size="lg" knob to="/challenges/new" className="w-full md:w-auto">
            <PlusIcon size={17} />
            تحدي لأصحابك
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[1fr_minmax(0,420px)]">
          <label className="sunk flex h-13 items-center gap-3 rounded-full px-4">
            <SearchIcon size={18} className="shrink-0 text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="دوّر على تحدي…"
              aria-label="دوّر على تحدي"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/30"
            />
          </label>
          <CodeEntry />
        </div>

        <FilterChips
          label="فلترة التحديات"
          value={filter}
          onChange={(key) => setParams(key === 'all' ? {} : { f: key })}
          options={FILTERS.map(([value, label]) => ({
            value,
            label,
            count: value === 'live' ? counts.live : value === 'mine' ? counts.mine : 0,
          }))}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[300px]" />)}
        </div>
      ) : visible.length > 0 ? (
        <div key={filter} className="grid grid-cols-[minmax(0,1fr)] animate-fadein gap-4 md:grid-cols-2">
          {visible.map((c, i) => (
            <ChallengeCard key={`${c.role || 'public'}-${c._id}`} challenge={c} currentGw={gw} role={c.role} featured={i === 0} />
          ))}
        </div>
      ) : (
        <Empty
          art={<EmptyNet />}
          title={filter === 'mine' ? 'لسه ما دخلتش أي تحدي خاص' : search ? 'مفيش تحدي بالاسم ده' : 'مفيش تحديات هنا دلوقتي'}
          hint={filter === 'mine' ? 'اعمل تحديك أو ادخل بكود دعوة من صاحبك' : counts.live ? `فيه ${counts.live} تحدي نشط دلوقتي` : 'التحديات الجديدة بتظهر هنا أول ما تتنشر'}
          action={
            filter === 'mine' ? <Button knob to="/challenges/new">اعمل تحدي</Button>
            : filter !== 'all' ? <Button variant="secondary" onClick={() => setParams({})}>شوف كل التحديات</Button>
            : null
          }
        />
      )}
    </AppPage>
  );
}
