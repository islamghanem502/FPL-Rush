import { BarsIcon, HomeIcon, TrophyIcon, UserIcon } from '@/components/kit/icons';

// The signed-in app's four places. `match` = path prefixes that belong to a
// tab (a challenge page lives under "التحديات").
export const NAV = [
  { to: '/home', label: 'الرئيسية', icon: HomeIcon, match: ['/home'] },
  { to: '/challenges', label: 'التحديات', icon: TrophyIcon, match: ['/challenge', '/join', '/public-challenge'] },
  { to: '/bonus', label: 'البونص', icon: BarsIcon, match: ['/bonus'] },
  { to: '/profile', label: 'حسابي', icon: UserIcon, match: ['/profile'] },
];

export const activeNav = (pathname) => NAV.findIndex((item) => item.match.some((prefix) => pathname.startsWith(prefix)));
