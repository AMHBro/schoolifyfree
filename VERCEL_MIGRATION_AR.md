# نقل المشروع بالكامل إلى Vercel

Vercel يستضيف الواجهات وAPI (Elysia). قاعدة البيانات ليست على Vercel: استخدم Neon أو Supabase أو Postgres سحابي.

## قيود Vercel

- REST API: يعمل.
- WebSocket (websocket.ts): لا يعمل كسيرفر دائم على Serverless — يحتاج Railway/خدمة أخرى أو Polling/SSE لاحقاً.
- Puppeteer/PDF: يحتاج إعداداً خاصاً أو خدمة منفصلة.

## الخطوات

### 1) قاعدة البيانات

- أنشئ Postgres (مثلاً Neon). انسخ `DATABASE_URL`.
- محلياً: `cd backend` ثم `npx prisma migrate deploy` مع نفس الرابط.

### 2) مشروع Backend على Vercel

- Root Directory: `backend`
- Env: `DATABASE_URL`, `JWT_SECRET` (+ واتساب إن لزم)
- بعد النشر انسخ الرابط (BACKEND_URL) وجرب `BACKEND_URL/health`

### 3) تطبيق المدرسة (الجذر مع vercel.json)

- في `vercel.json` الحقل `destination` يوجّه إلى الباك إند. تم ضبط مثال على `https://schoolifyfree-22pt.vercel.app` — إن كان رابط مشروع الباك إند عندك مختلفاً (من لوحة Vercel → Domains)، عدّل الملفين في `rewrites` ثم ادفع و Redeploy.

### 4) Central Dashboard

- Root: `central-dashboard`
- في Vercel أضف `VITE_API_BASE_URL` = نفس BACKEND_URL (بدون / في النهاية)
- Redeploy

### 5) schoolify-website

- Root: `schoolify-website`
- `VITE_API_BASE_URL` = BACKEND_URL
- Redeploy

### 6) إيقاف Railway

- بعد التأكد من عمل كل شيء، أوقف الخدمات على Railway.

تفاصيل إضافية: `backend/VERCEL_DEPLOY.md`
