# دليل المشروع والنشر (مرجع واحد)

الهدف الافتراضي: **داشبورد المدرسة (ويب)** + **الداشبورد المركزية** + **API** — بدون التركيز على تطبيقات الموبايل.

---

## 1) خريطة المستودع

| المجلد | الوظيفة | Root على Vercel |
|--------|---------|------------------|
| جذر الريبو (مشروع `sms` + Vite) | داشبورد المدرسة | `.` |
| `central-dashboard/` | الداشبورد المركزية | `central-dashboard` |
| `backend/` | API (Elysia + Prisma) | `backend` |
| `schoolify-website/` | موقع تعريفي | اختياري |
| `teacher-app/` ، `student_app/` | موبايل | لا تُنشر كويب على Vercel |

---

## 2) المطلوب في السحابة

- **PostgreSQL** (Neon / Supabase / غيره) — ليس داخل Vercel.
- **3 مشاريع Vercel:** backend + داشبورد المدرسة (الجذر) + central-dashboard.

---

## 3) الترتيب (اتبعه بالترتيب)

1. أنشئ Postgres وانسخ `DATABASE_URL`.
2. على جهازك: `cd backend` ثم `npx prisma migrate deploy` (بنفس `DATABASE_URL` الإنتاجي).
3. انشر **backend** على Vercel (Root = `backend`) مع `DATABASE_URL` و `JWT_SECRET`. سجّل **BACKEND_URL** بدون `/` في النهاية. جرّب `BACKEND_URL/health`.
4. عدّل **`vercel.json`** في الجذر: ضع **BACKEND_URL** الحقيقي في حقلي `destination` لـ `/api` و `/auth`. ادفع إلى Git.
5. انشر **داشبورد المدرسة** (Root = جذر الريبو حيث يوجد `vercel.json`). Redeploy إن لزم.
6. انشر **central-dashboard** (Root = `central-dashboard`) وأضف **`VITE_API_BASE_URL`** = **BACKEND_URL**. **Redeploy** بعد المتغير.
7. (اختياري) أوقف Railway أو الباك إند القديم بعد التأكد.

---

## 4) متغيرات البيئة

| المشروع | المتغيرات |
|---------|-----------|
| backend | `DATABASE_URL` ، `JWT_SECRET` |
| داشبورد المدرسة (جذر) | عادةً لا شيء (يعتمد على `vercel.json`) |
| central-dashboard | `VITE_API_BASE_URL` = BACKEND_URL |
| schoolify-website (اختياري) | `VITE_API_BASE_URL` = BACKEND_URL |

---

## 5) قيود Vercel

- **WebSocket** (`websocket.ts`): لا يعمل كنفس نمط السيرفر الدائم على Serverless.
- **Puppeteer / PDF:** قد يحتاج إعدادًا إضافيًا — راجع `backend/VERCEL_DEPLOY.md`.

---

## 6) استكشاف الأخطاء

- Vercel: **Logs → Functions**
- تفاصيل الباك إند: `backend/VERCEL_DEPLOY.md`

---

(نسخة إنجليزية مختصرة للبحث: نفس الأقسام أعلاه — `README.md` يشير إلى هذا الملف.)
