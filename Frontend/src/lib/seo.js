// What search engines (and the browser tab) see for each route. Public pages
// get their own title, description and canonical URL and are indexed;
// everything behind sign-in is noindex (and disallowed in public/robots.txt).

export const SITE = 'https://www.fplrush.app';
const BRAND = 'FPL Rush';

export const DEFAULT_TITLE = 'FPL Rush — جمعت كام نقطة؟';
export const DEFAULT_DESCRIPTION =
  'كل جولة زي أول جولة — تحديات فانتازي البريميرليج بجولات محددة والكل بيبدأ من صفر. اربط فريقك، ادخل تحدي عام أو اعمل تحدي لأصحابك، وتابع الترتيب مباشر.';

const named = (name) => `${name} — ${BRAND}`;

const PAGES = [
  { match: /^\/$/, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, index: true },
  {
    match: /^\/bonus\/?$/,
    title: named('بونص اللاعبين لحظة بلحظة'),
    description: 'نقاط البونص المتوقعة لكل ماتش في جولة البريميرليج — بتتحدّث كل دقيقة أثناء الماتشات، ومن غير تسجيل.',
    index: true,
  },
  {
    match: /^\/partnership\/?$/,
    title: named('الشراكات'),
    description: 'اعمل تحدي فانتازي باسم البراند أو القناة بتاعتك: بجولاتك وشروطك وجوائزك، وإحنا علينا الحسابات والترتيب.',
    index: true,
  },
  {
    match: /^\/register\/?$/,
    title: named('اعمل حسابك'),
    description: 'اربط فريقك من فانتازي البريميرليج ووثّقه، وادخل التحديات العامة أو اعمل تحدي لأصحابك.',
    index: true,
  },
  { match: /^\/login\/?$/, title: named('دخول') },
  { match: /^\/forgot\/?$/, title: named('نسيت كلمة المرور') },
  { match: /^\/home\/?$/, title: named('الرئيسية') },
  { match: /^\/challenges\/new\/?$/, title: named('تحدي جديد') },
  { match: /^\/challenges\/[^/]+\/edit\/?$/, title: named('تعديل التحدي') },
  { match: /^\/challenges\/?$/, title: named('التحديات') },
  { match: /^\/challenge\//, title: named('التحدي') },
  { match: /^\/join\//, title: named('دعوة خاصة') },
  { match: /^\/public-challenge\/?$/, title: named('تحدي عام') },
  { match: /^\/profile\/?$/, title: named('حسابي') },
  { match: /^\/admin\/?$/, title: named('لوحة التحكم') },
];

export const seoFor = (pathname) => PAGES.find((page) => page.match.test(pathname)) || { title: DEFAULT_TITLE };

// A page's own name in the tab (a challenge's title, say).
export const pageTitle = (name) => named(name);

const upsert = (selector, make) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = make();
    document.head.appendChild(el);
  }
  return el;
};

const meta = (key, value, attr = 'name') => {
  upsert(`meta[${attr}="${key}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    return el;
  }).setAttribute('content', value);
};

export function applySeo({ title, description = DEFAULT_DESCRIPTION, index = false }, pathname) {
  document.title = title;
  meta('description', description);
  meta('robots', index ? 'index, follow, max-image-preview:large' : 'noindex, follow');
  meta('og:title', title, 'property');
  meta('og:description', description, 'property');

  const url = `${SITE}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (index) {
    upsert('link[rel="canonical"]', () => {
      const el = document.createElement('link');
      el.rel = 'canonical';
      return el;
    }).href = url;
    meta('og:url', url, 'property');
  } else {
    canonical?.remove();
  }
}
