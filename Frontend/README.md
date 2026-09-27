# FPL Rush — Frontend

واجهة FPL Rush بالهوية الجديدة (ورق + حبر + أصفر/أحمر/تيل). React 19 + Vite + Tailwind v4 + TanStack Query.

## التشغيل

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # dist/
```

`.env.local`:

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=...          # اختياري — بدونه يختفي زر Google
VITE_PUBLIC_CHALLENGE_WHATSAPP=... # اختياري
```

## البنية

```
src/
  styles.css            ← كل ألوان/خطوط/استدارات الهوية كـ @theme tokens
  lib/                  ← api client, token, format, challenge helpers (pure)
  api/                  ← دوال الـ endpoints فقط (auth, challenges, bonus)
  hooks/                ← React Query: useAuth, useChallenges, useBonus, useCountUp
  components/ui/        ← Button, Chip, Card, Numbers, NameStrip, Field, Misc
  components/layout/    ← Chrome (الهيدر الأسود), Shell (Page + TabBar), Footer, RequireAuth
  components/challenge/ ← ChallengeCard, Standings, Podium, ChallengeForm, InviteBox, OwnerMode
  pages/                ← شاشة لكل route
```

## الهوية v3 — "Pitch" (قيد النقل صفحة بصفحة)

الصفحات تنتقل للهوية الجديدة واحدة واحدة؛ البداية كانت `Landing`. باقي الصفحات ما زالت على v2 (القسم التالي) حتى يتم نقلها.

- **لونان فقط:** `night` (الخلفية + درجتان للأسطح: `night-2` مرتفع، `night-3` غائر) و`pitch` الأخضر (الأفعال، "مفعّل"، أنت). الأبيض للنص والـ knob فقط.
- **الحدّ الأسود + الظل الصلب = "اضغطني". فقط.** الأزرار، الـ Toggle، الـ Slider، الـ Segmented: حدّ 2px (`border-edge`) + ظل صلب (`shadow-hard*`) + `press`. كل ما لا يُضغط **مسطّح**: الأسطح `Panel` (night-2 + خط شعري)، الصفوف، الأرقام، الرسوم التوضيحية. لا تضع عنصر تحكم مزيّفًا (Toggle/Slider للزينة) — يبدو زرًا ولا يعمل.
- **بارز = اضغط، غائر = اكتب:** الحقول `sunk` (ظل داخلي من الأعلى) عكس الأزرار البارزة. الزر المعطّل يفقد ظله ويبهت (`press` + `disabled`).
- **لونان مساعدان بالقطارة:** `volt` لحالة «مباشر/الآن» فقط (ماتش جاري، الجولة الحالية). `alert` للأخطاء فقط (أيقونة التوست، كود منتهي) — أبدًا سطح.
- **Google أولًا:** في الدخول والتسجيل زر Google في الأعلى وبعرض كامل (`GoogleButton` + `OrEmail`). لازم يفضل زر Google الرسمي (الباك يتحقق من الـ ID token) — نحن نؤطّره فقط.
- **التوثيق إجباري:** لا أحد يدخل أي صفحة من الداشبورد قبل ربط فريقه **وتوثيقه** في دوري FPL Rush (`isVerified`). الحارس في `RequireAuth`، والوجهة بعد الدخول من `homeFor()` في `lib/challenge.js` — ومن جاء من رابط دعوة يرجع له بعد التوثيق. لا يوجد «تخطي».
- **صفحات الحساب بلا رسومات زينة:** صورة الهاتف تظهر فقط في مرحلتي ربط الفريق والتوثيق (ديسكتوب).
- **الموبايل أولًا:** كل صفحة تُراجَع على 390 و360px بدون أي overflow أفقي. عمود نموذج؟ استخدم `flex flex-col` (grid `auto` يتمدد لأعرض محتوى، مثل iframe Google).
- **الروابط نص، الأفعال أزرار:** روابط الـ nav نص عادي؛ الفعل زر حبة (pill) ملموس. زر يقود للأمام يحمل `knob` بسهم.
- **الـ knob هو الهوية:** الدائرة البيضاء بحد أسود (`knob`) — في الـ Toggle والـ Slider والأزرار، والشعار نفسه Toggle مفعّل (وهو الـ favicon).
- **ضد القوالب المكررة (AI slop):** لا شارات pill بنقطة نابضة فوق العنوان، لا شبكة 3 بطاقات بأيقونة و"01/02/03"، لا بطاقة "أيقونة في دائرة + عنوان + وصف + سهم". المحتوى يشرح المنتج الحقيقي (ربط فريق FPL، تحديات عامة/خاصة).
- **صورة الهاتف (`landing.png`) مقصودة:** هي تطبيق FPL الرسمي لأن المنصة تعمل على فريقك الحقيقي — أول رسالة: "اربط فريقك". لا تُستبدل.
- **الخطوط:** `font-display` = Alexandria (العناوين، الأزرار، الأرقام) · `font-text` = IBM Plex Sans Arabic (النصوص).
- **RTL:** "للأمام" يشير لليسار؛ الـ Toggle المفعّل يكون الـ knob على اليسار؛ الـ Slider يمتلئ من اليمين.
- **HashRouter:** الروابط داخل الصفحة لا تستخدم `href="#id"` (الـ hash للراوتر) — استخدم `scrollIntoView` (انظر `SiteNav` links بـ `onClick`).

```
src/
  components/kit/       ← Button (+ IconButton), Toggle, Slider, Segmented, Gw, Panel, icons
  components/site/      ← SiteNav, SiteFooter, Wordmark (v3)
  components/landing/   ← أقسام صفحة الهبوط
  motion/gsap.js        ← تسجيل GSAP + plugins مرة واحدة، MOTION_OK
  motion/scenes/        ← مشاهد Remotion + specs.js (المقاسات بدون استيراد remotion)
```

### الحركة

- **GSAP** لحركة الصفحة: كل choreography داخل `gsap.matchMedia().add(MOTION_OK, …)` فمستخدمو reduced-motion يرون الشكل النهائي ولا يختفي شيء. استخدم `useGSAP` مع `scope`.
- **Remotion** للمشاهد (`@remotion/player`): تُحمَّل بـ `lazy()` فقط حيث تُستخدم (خارج الـ bundle الرئيسي). احجز مكانها بـ `aspect(spec)` من `specs.js`.
- كل `<Player>` صامت يحتاج `initiallyMuted` (وإلا ينتظر AudioContext لا يبدأ قبل نقرة، فلا يعمل autoPlay) و`direction: 'ltr'` على الـ Player نفسه (المشهد يضبط RTL داخله).
- النص العربي يُحرَّك كلمة كلمة، أبدًا حرفًا حرفًا (الحروف متصلة).
- `remotion` و`@remotion/*` بإصدار واحد مثبّت بالضبط (بدون `^`).

## قواعد الهوية v2 (الصفحات التي لم تُنقل بعد)

- الرقم يسكن لوحة: `NumberPanel` / `RankTile` (استدارة 8) داخل بطاقة (استدارة 20).
- حادّ = بيانات، مدوّر = أفعال: الأزرار والشرائح pills، اللوحات والجداول حادّة.
- زر أساسي واحد (أحمر + قرص أصفر) لكل شاشة — `Button variant="primary"`.
- صفّك في أي جدول = `NameStrip` (أسود، اسمك بالأصفر، مع سبب: الفارق أو النسبة). مرة واحدة في الشاشة.
- الشريط المقلم مرة واحدة أعلى `Chrome`.
- الأصفر = أنت/الفائز فقط. الأحمر = الفعل فقط. التيل = مباشر/موثق.
- كل صورة تدخل المنصة تُعرض `duotone` (أسود/أصفر) — CSS فقط.
- الأرقام واللاتيني بخط Archivo 900 (`.num`, `.num-display`, `.jersey`)، العربي Cairo 600/900 فقط.
- لا إيموجي، لا تدرجات، لا انتقالات صفحات. الحركة الوحيدة: عدّ الأرقام 600ms ونبض المباشر.

## الحالة (state)

لا يوجد Context أو store. `useMe()` هو مصدر الحقيقة للمستخدم؛ التوكن فقط في `localStorage`.
كل قراءة `useQuery` وكل كتابة `useMutation` مع invalidation في `hooks/`.

الراوتر `HashRouter` عن قصد: روابط الدعوة القادمة من الباك `/#/join/CODE`.
