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

## قواعد الهوية المطبّقة في الكود

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
