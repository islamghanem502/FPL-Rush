# FPL Rush — Frontend

واجهة FPL Rush بهوية "Pitch" (ليل + أخضر الملعب). React 19 + Vite + Tailwind v4 + TanStack Query + GSAP + Remotion.

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
  styles.css            ← كل ألوان/خطوط/استدارات الهوية كـ @theme tokens + utilities (press, sunk, knob, mowed, ticket…)
  lib/                  ← api client, token, format, challenge helpers (pure)
  api/                  ← دوال الـ endpoints فقط (auth, challenges, bonus)
  hooks/                ← React Query: useAuth, useChallenges, useBonus + useCountUp, useArmed
  components/kit/       ← Button (+ IconButton, TextLink), Field, Toggle, Slider, Segmented, Steps, Panel, Gw, icons,
                          Avatar, Crest, Tag, Medal, Choice (FilterChips, ChoiceTiles), GwTrack, GwPicker, Heading, Feedback
  components/layout/    ← Shell (+ TabBar), AppPage, AppBar, nav, RequireAuth, ScrollToTop
  components/site/      ← SiteNav, SiteFooter, Wordmark, GoogleButton — للصفحات العامة
  components/art/       ← رسومات SVG: EmptyNet, TornTicket, PitchLines, TacticsBoard, VarScreen
  components/challenge/ ← ChallengeCard, Standings, Podium, ChallengeForm, InviteBox, OwnerMode, Parts (Eligibility, PrizeList, Ticket)
  components/landing/   ← أقسام صفحة الهبوط
  components/auth/      ← AuthShell
  components/bonus/     ← FixtureCard, GwScrubber
  motion/               ← gsap.js (تسجيل مرة واحدة، MOTION_OK)، confetti.js، fonts.js، scenes/ (Remotion)
  pages/                ← شاشة لكل route
```

## الهوية — "Pitch"

كل الصفحات على الهوية دي (هوية v2 القديمة — ورق وحبر وأصفر — اتشالت بالكامل).

- **لونان فقط:** `night` (الخلفية + درجتان للأسطح: `night-2` مرتفع، `night-3` غائر) و`pitch` الأخضر (الأفعال، "مفعّل"، أنت). الأبيض للنص والـ knob فقط.
- **الحدّ الأسود + الظل الصلب = "اضغطني". فقط.** الأزرار، الـ Toggle، الـ Slider، الـ Segmented: حدّ 2px (`border-edge`) + ظل صلب (`shadow-hard*`) + `press`. كل ما لا يُضغط **مسطّح**: الأسطح `Panel` (night-2 + خط شعري)، الصفوف، الأرقام، الرسوم التوضيحية. لا تضع عنصر تحكم مزيّفًا (Toggle/Slider للزينة) — يبدو زرًا ولا يعمل.
- **بارز = اضغط، غائر = اكتب:** الحقول `sunk` (ظل داخلي من الأعلى) عكس الأزرار البارزة. الزر المعطّل يفقد ظله ويبهت (`press` + `disabled`).
- **لونان مساعدان بالقطارة:** `volt` لحالة «مباشر/الآن» فقط (ماتش جاري، الجولة الحالية). `alert` للأخطاء فقط (أيقونة التوست، كود منتهي) — أبدًا سطح.
- **Google أولًا:** في الدخول والتسجيل زر Google في الأعلى وبعرض كامل (`GoogleButton` + `OrEmail`). لازم يفضل زر Google الرسمي (الباك يتحقق من الـ ID token) — نحن نؤطّره فقط.
- **التوثيق إجباري:** لا أحد يدخل أي صفحة من الداشبورد قبل ربط فريقه **وتوثيقه** في دوري FPL Rush (`isVerified`). الحارس في `RequireAuth`، والوجهة بعد الدخول من `homeFor()` في `lib/challenge.js` — ومن جاء من رابط دعوة يرجع له بعد التوثيق. لا يوجد «تخطي».
- **صفحات الحساب بلا رسومات زينة:** صورة الهاتف تظهر فقط في مرحلتي ربط الفريق والتوثيق (ديسكتوب).
- **الموبايل أولًا:** كل صفحة تُراجَع على 390 و360px بدون أي overflow أفقي. عمود نموذج؟ استخدم `flex flex-col` (grid `auto` يتمدد لأعرض محتوى، مثل iframe Google). أي grid أعمدته `md:` بس لازم يبدأ بـ `grid-cols-[minmax(0,1fr)]` على الموبايل.
- **الروابط نص، الأفعال أزرار:** روابط الـ nav نص عادي؛ الفعل زر حبة (pill) ملموس. زر يقود للأمام يحمل `knob` بسهم.
- **الـ knob هو الهوية:** الدائرة البيضاء بحد أسود (`knob`) — في الـ Toggle والـ Slider والأزرار، والشعار نفسه Toggle مفعّل (وهو الـ favicon).
- **ضد القوالب المكررة (AI slop):** لا شارات pill بنقطة نابضة فوق العنوان، لا شبكة 3 بطاقات بأيقونة و"01/02/03"، لا بطاقة "أيقونة في دائرة + عنوان + وصف + سهم". المحتوى يشرح المنتج الحقيقي (ربط فريق FPL، تحديات عامة/خاصة).
- **صورة الهاتف (`landing.png`) مقصودة:** هي تطبيق FPL الرسمي لأن المنصة تعمل على فريقك الحقيقي — أول رسالة: "اربط فريقك". لا تُستبدل.
- **الخطوط:** `font-display` = Alexandria (العناوين، الأزرار، الأرقام) · `font-text` = IBM Plex Sans Arabic (النصوص).
- **RTL:** "للأمام" يشير لليسار؛ الـ Toggle المفعّل يكون الـ knob على اليسار؛ الـ Slider يمتلئ من اليمين.
- **HashRouter:** الروابط داخل الصفحة لا تستخدم `href="#id"` (الـ hash للراوتر) — استخدم `scrollIntoView` (انظر `SiteNav` links بـ `onClick`).

- **"أنت" = رقعة ملعب:** السطح `mowed` (أخضر بخطوط جزّ النجيلة) محجوز لما يخصّك: كارت فريقك في الرئيسية، مكانك في التحدي، كارت المدرب، تذكرة الدعوة، ومنصة البطل. صفّك في أي جدول صف `pitch` كامل.
- **الرسومات ستيكرات:** SVG مسطّح بحد أسود 3px، ألوانه من الـ tokens بس (night-2/3، pitch، pitch-deep، أبيض، volt بالقطارة)، من غير تدرجات. اللاعبين knobs، والخطوط طباشير أبيض. كل حالة فاضية ليها رسمة (`EmptyNet`، `TornTicket`) وسبب وفعل واحد بالكتير.
- **الجولات تتقري كشريط:** `GwTrack` خلايا: اتلعبت = pitch، الحالية = volt، الجاية = باهتة. قراءة مش تحكّم — من غير knob. الاختيار الحقيقي بـ `GwPicker` (Slider + أسهم).
- **الأفعال اللي مالهاش رجوع بتطلب ضغطة تانية:** `useArmed` بدل الـ modal (الانضمام لتحدي، كود دعوة جديد) — مع سطر يشرح النتيجة، وشريط بيفضى لما يبقى فيه وقت محدد.
- **التنقل:** الموبايل = شريط سفلي عايم (`TabBar`) فيه الـ pill الأخضر بيتزحلق بين الأماكن الأربعة؛ الديسكتوب = روابط نص في `AppBar`. كل صفحة جوه التطبيق بتتلف بـ `AppPage` (وليها `back` للصفحات الفرعية).

### الحركة

- **GSAP** لحركة الصفحة: كل choreography داخل `gsap.matchMedia().add(MOTION_OK, …)` فمستخدمو reduced-motion يرون الشكل النهائي ولا يختفي شيء. استخدم `useGSAP` مع `scope`. `AppPage` بيطلّع أبناءه المباشرين واحد ورا التاني (ومرة تانية لما `stepKey` يتغيّر).
- **الاحتفال نادر:** `confetti()` (من `motion/confetti.js`) بس للمكسب الحقيقي — تحدي اتعمل، أو بطل اتتوّج. قطعه من أشكال الهوية.
- **Remotion** للمشاهد (`@remotion/player`): تُحمَّل بـ `lazy()` فقط حيث تُستخدم (خارج الـ bundle الرئيسي). احجز مكانها بـ `aspect(spec)` من `specs.js`.
- كل `<Player>` صامت يحتاج `initiallyMuted` (وإلا ينتظر AudioContext لا يبدأ قبل نقرة، فلا يعمل autoPlay) و`direction: 'ltr'` على الـ Player نفسه (المشهد يضبط RTL داخله).
- النص العربي يُحرَّك كلمة كلمة، أبدًا حرفًا حرفًا (الحروف متصلة).
- `remotion` و`@remotion/*` بإصدار واحد مثبّت بالضبط (بدون `^`).

## الظهور في جوجل والمشاركة

- الشعار (slogan): **كل جولة زي أول جولة** — في `<title>` و`description` وصورة المشاركة.
- `public/`: `favicon.ico` (16/32/48) و`favicon.svg` و`icon-192.png` (جوجل عايز مربع من مضاعفات 48px)، و`icon-512.png` + `icon-maskable-512.png` للـ `site.webmanifest`، و`og-image.png` (1200×630) لمعاينة الروابط في واتساب وغيره.
- `index.html` فيه Open Graph وJSON-LD (`WebSite` + `Organization` بالاسم واللوجو). أي تغيير في الاسم أو الشعار يتغيّر هناك.
- جوجل بيحدّث الأيقونة والعنوان بعد ما يعيد زحف الصفحة الرئيسية — اطلب ده من Search Console (فحص الرابط ← طلب فهرسة).

## الحالة (state)

لا يوجد Context أو store. `useMe()` هو مصدر الحقيقة للمستخدم؛ التوكن فقط في `localStorage`.
كل قراءة `useQuery` وكل كتابة `useMutation` مع invalidation في `hooks/` — مفيش `fetch`/`axios` مباشر من أي component.
كروت التحديات بتعمل `usePrefetchChallenge` مع hover/focus/touch، فصفحة التحدي بتفتح من الكاش على طول وبعدين تتحدّث.

الراوتر `HashRouter` عن قصد: روابط الدعوة القادمة من الباك `/#/join/CODE`.
