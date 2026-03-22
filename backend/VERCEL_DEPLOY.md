# نشر الـ Backend على Vercel

**الدليل الشامل لكل المشروع (داشبورد المدرسة + المركزية + API):** [`../DEPLOY_GUIDE_AR.md`](../DEPLOY_GUIDE_AR.md)

---

## المتطلبات في لوحة Vercel

1. **New Project** → اربط مستودع GitHub نفسه.
2. **Root Directory**: اضبطها على **`backend`** (مهم جدًا).
3. **Framework Preset**: غالبًا يكتشف Vercel **Elysia** تلقائيًا؛ إن لم يحدث، اختر **Other** واترك الأوامر الافتراضية أو اتركها فارغة حسب ما يعرضه Vercel.
4. **Runtime**: يستخدم المشروع **Bun** عبر `vercel.json` (`bunVersion`).

## متغيرات البيئة (Environment Variables)

 انسخ من Railway أو من `.env` المحلي كل ما يلزم، على الأقل:

| المتغير | ملاحظة |
|--------|--------|
| `DATABASE_URL` | لـ Prisma؛ لقواعد serverless يُفضّل استخدام **connection pooling** (مثل `?pgbouncer=true` أو عبر Prisma Accelerate) |
| `JWT_SECRET` | مطلوب |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | إن استخدمت واتساب |
| `PUPPETEER_EXECUTABLE_PATH` | اختياري — إن أردت PDF يعمل على Vercel، ربط مسار Chromium (مثل حزمة `@sparticuz/chromium`) |
| أي متغيرات أخرى يعتمد عليها `index.ts` | راجع إعداداتك الحالية |

## ما يعمل وما لا يعمل على Vercel

- **يعمل**: طلبات HTTP لـ Elysia (`/api/*`, `/auth/*`, إلخ) كـ Serverless.
- **لا يعمل كما على Railway**:
  - **WebSocket** (`websocket.ts`): Vercel Serverless لا يشغّل سيرفر WS دائم. إبقِ المحادثات الفورية على **Railway** أو خدمة WS منفصلة، أو استبدلها بـ SSE/Polling للويب فقط.
  - **Puppeteer / تقارير PDF**: على Vercel قد لا يوجد Chrome افتراضيًا؛ تم تحميل Puppeteer **ديناميكيًا** فقط عند طلب PDF. للعمل على Vercel غالبًا تحتاج `PUPPETEER_EXECUTABLE_PATH` أو الإبقاء على Railway لتوليد PDF.

الكود يضبط `export default app` عندما يكون `VERCEL`/`VERCEL_ENV` معرّفًا، ولا يستدعي `.listen()` ولا يحمّل `websocket.ts`.

### إن ظهر `500 FUNCTION_INVOCATION_FAILED`

1. من Vercel: **Project → Logs → Functions** وابحث عن أول خطأ (Prisma، متغير بيئة، إلخ).
2. جرّب في المتصفح: `https://مشروعك.vercel.app/health` — إن فشل، غالبًا **`DATABASE_URL`** أو اتصال قاعدة البيانات.
3. مع **Neon**: استخدم رابط **Connection pooling** (مثل منفذ `6543` أو المعاملات الموصى بها من Neon) إن ظهرت أخطاء اتصال أو `too many connections`.
4. نفّذ migrations على قاعدة الإنتاج مرة واحدة (محليًا مع نفس `DATABASE_URL`):  
   `npx prisma migrate deploy`  
   بدون جداول/مخطط صحيح قد تفشل أول استعلام.
5. على الإنتاج **لا يُفعّل Swagger** تلقائيًا (يُعطّل على Vercel لتقليل التعطل والذاكرة).

## بعد النشر — ربط الفرونت (مرفوع مسبقًا على Vercel)

1. من لوحة Vercel انسخ رابط الباك إند، مثل: `https://sms-backend-xxxx.vercel.app` (بدون `/` في النهاية).

2. في **نفس المستودع**، افتح ملف **`vercel.json` في جذر مشروع الواجهة** (ليس داخل `backend/`) — عندك حاليًا يوجّه إلى Railway. استبدل الرابط في قسمَي `rewrites`:

```json
{
  "source": "/api/:path*",
  "destination": "https://sms-backend-xxxx.vercel.app/api/:path*"
},
{
  "source": "/auth/:path*",
  "destination": "https://sms-backend-xxxx.vercel.app/auth/:path*"
}
```

3. ادفع التعديل إلى Git أو من Vercel اختر **Redeploy** لمشروع **الفرونت** حتى تُطبَّق الـ rewrites الجديدة.

بهذا يبقى الفرونت على نفس الدومين كما هو، والطلبات تمر إلى الباك إند على Vercel.

## التثبيت المحلي (Vercel CLI)

```bash
cd backend
npm i -g vercel@latest
vercel login
vercel
```

---

**ملخص**: Vercel مناسب لـ **REST API**؛ للـ **WebSocket + Puppeteer + عمليات طويلة** يبقى **Railway** (أو خادم تقليدي) الخيار الأكثر موثوقية.
