import { PrismaClient } from "@prisma/client";

/** منع إنشاء عدة عميلات Prisma في نفس الـ isolate (مهم على Vercel Serverless). */
const globalForPrisma = globalThis as typeof globalThis & {
  __SCHOOLIFY_PRISMA__?: PrismaClient;
};

const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

export const prisma =
  globalForPrisma.__SCHOOLIFY_PRISMA__ ??
  new PrismaClient({
    log: onVercel ? ["error"] : ["warn", "error"],
  });

if (onVercel) {
  globalForPrisma.__SCHOOLIFY_PRISMA__ = prisma;
}
