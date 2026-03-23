import { PrismaClient } from "@prisma/client";

/**
 * Prisma على Vercel (Serverless):
 * - لا نريد إنشاء PrismaClient في وقت الاستيراد (top-level) لأن فشل تحميل engine
 *   سيكسر الـ function قبل ما نقدر نرجع JSON.
 * - ننشئ العميل عند أول استخدام (lazy).
 */

const globalForPrisma = globalThis as typeof globalThis & {
  __SCHOOLIFY_PRISMA__?: PrismaClient;
};

const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

let prismaInstance: PrismaClient | undefined = onVercel
  ? globalForPrisma.__SCHOOLIFY_PRISMA__
  : undefined;

const createPrisma = () =>
  new PrismaClient({
    log: onVercel ? ["error"] : ["warn", "error"],
  });

function getPrisma() {
  if (prismaInstance) return prismaInstance;
  prismaInstance = globalForPrisma.__SCHOOLIFY_PRISMA__ ?? createPrisma();
  if (onVercel) globalForPrisma.__SCHOOLIFY_PRISMA__ = prismaInstance;
  return prismaInstance;
}

// Proxy يؤجل تهيئة PrismaClient حتى أول استخدام فقط
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const p = getPrisma();
    const value = (p as any)[prop];
    if (typeof value === "function") return value.bind(p);
    return value;
  },
});
