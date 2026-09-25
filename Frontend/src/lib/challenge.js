// Pure helpers that read a challenge the way the backend defines it.

export const isFplLinked = (user) => user?.accountStatus === 'fpl_linked' && Boolean(user?.fpl_id);
export const isAdmin = (user) => user?.role === 'admin';

// One word the UI can key on. `currentGw` comes from /bonus/current-gw.
export const challengeState = (challenge, currentGw) => {
  if (!challenge) return 'upcoming';
  if (challenge.status === 'finished') return 'finished';
  if (challenge.status === 'closing') return 'closing';
  if (challenge.status === 'cancelled') return 'cancelled';
  if (currentGw && Number(currentGw) < Number(challenge.startEvent)) return 'upcoming';
  return 'live';
};

export const STATE_LABEL = {
  live: 'نشط',
  upcoming: 'يبدأ قريبًا',
  closing: 'جارٍ تثبيت النتائج',
  finished: 'انتهى',
  cancelled: 'ملغي',
};

// Mirrors eligibilityError() in the backend so the button can explain itself
// before the request is sent.
export const eligibility = (user, challenge) => {
  if (!user || !challenge) return [];
  return [
    {
      key: 'points',
      label: 'الحد الأدنى للنقاط',
      value: challenge.minTotalPoints ? `+${challenge.minTotalPoints}` : 'بدون حد',
      ok: Number(user.totalPoints || 0) >= Number(challenge.minTotalPoints || 0),
    },
    {
      key: 'rank',
      label: 'الترتيب العام',
      value: challenge.maxOverallRank < 10_000_000 ? `حتى #${Number(challenge.maxOverallRank).toLocaleString('en-US')}` : 'أي ترتيب',
      ok: Number(user.overallRank || Number.MAX_SAFE_INTEGER) <= Number(challenge.maxOverallRank || 10_000_000),
    },
    {
      key: 'started',
      label: 'بداية حسابك في FPL',
      value: challenge.latestStartedEvent < 38 ? `قبل GW ${challenge.latestStartedEvent}` : 'أي وقت',
      ok: Boolean(user.startedEvent) && Number(user.startedEvent) <= Number(challenge.latestStartedEvent || 38),
    },
    {
      key: 'window',
      label: 'الانضمام مفتوح',
      value: `حتى GW ${challenge.endEvent}`,
      ok: Number(user.currentEvent || 0) <= Number(challenge.endEvent || 0),
    },
  ];
};

export const prizes = (challenge) =>
  [
    ['المركز الأول', challenge?.prize],
    ['المركز الثاني', challenge?.prizeSecond],
    ['المركز الثالث', challenge?.prizeThird],
  ].filter(([, value]) => value);

export const inviteUrl = (invite) => (invite?.inviteUrl ? `${window.location.origin}/${invite.inviteUrl.replace(/^\//, '')}` : '');

export const FPL_TEAM_URL = 'https://fantasy.premierleague.com/my-team';
export const WHATSAPP_SUPPORT = 'https://wa.me/201094474067';
export const LEAGUE_CODE = 'v8hg1z';
