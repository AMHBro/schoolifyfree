# Schoolify — منصة المدارس

مستودع يضم **واجهة داشبورد المدرسة**، **الداشبورد المركزية**، و**الـ API** (Elysia + Prisma).

## البدء السريع

| المكوّن | المجلد |
|---------|--------|
| داشبورد المدرسة (ويب) | جذر المشروع (`npm run dev`) |
| الداشبورد المركزية | `central-dashboard/` |
| الـ API | `backend/` (`bun run dev` أو `npm run start`) |

## النشر (Vercel + Postgres)

| الملف | المحتوى |
|-------|---------|
| [**`DEPLOY_GUIDE_AR.md`**](./DEPLOY_GUIDE_AR.md) | **المرجع الرئيسي:** خريطة المجلدات، الترتيب، المتغيرات، `vercel.json` |
| [`VERCEL_MIGRATION_AR.md`](./VERCEL_MIGRATION_AR.md) | يشير إلى الدليل أعلاه |
| [`backend/VERCEL_DEPLOY.md`](./backend/VERCEL_DEPLOY.md) | تفاصيل الباك إند واستكشاف الأخطاء |

أمثلة متغيرات محلية: **`central-dashboard/.env.example`** ، **`.env.example`** (الجذر).

## تطبيقات الموبايل (اختياري)

مجلدات `teacher-app/` و`student_app/` — مشاريع منفصلة عن نشر الويب.

## التطوير المحلي

```bash
# واجهة المدرسة
npm install && npm run dev

# الباك إند (يتطلب Bun أو بيئة متوافقة + .env)
cd backend && bun install && bun run dev
```

ضع `DATABASE_URL` و`JWT_SECRET` في `backend/.env` (لا ترفع `.env` إلى Git).
