/*
  Warnings:

  - A unique constraint covering the columns `[stageId,dayOfWeek,timeSlot,schoolId]` on the table `schedules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,schoolId]` on the table `stages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber,schoolId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,schoolId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,stageId,schoolId]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId]` on the table `system_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber,schoolId]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `exams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `stages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `system_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `teacher_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `teachers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "schedules_stageId_dayOfWeek_timeSlot_key";

-- DropIndex
DROP INDEX "stages_name_key";

-- DropIndex
DROP INDEX "students_code_key";

-- DropIndex
DROP INDEX "students_phoneNumber_key";

-- DropIndex
DROP INDEX "subjects_name_key";

-- DropIndex
DROP INDEX "teachers_phoneNumber_key";

-- Create tables first
-- CreateTable
CREATE TABLE "central_admins" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "central_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "central_admins_username_key" ON "central_admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "schools_username_key" ON "schools"("username");

-- Insert a default school for existing data
INSERT INTO "schools" ("id", "username", "password", "schoolName", "createdAt", "updatedAt") 
VALUES ('00000000-0000-0000-0000-000000000001', 'defaultschool', '$2b$10$defaultpassword', 'Default School', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add schoolId columns with default value, then remove default
-- AlterTable
ALTER TABLE "teachers" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "teachers" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "teachers" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "teachers" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "students" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "students" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stages" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "stages" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "stages" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "stages" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "subjects" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "subjects" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "subjects" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "exams" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "exams" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "exams" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "schedules" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "schedules" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "schedules" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "teacher_posts" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "teacher_posts" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "teacher_posts" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "teacher_posts" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "schoolId" UUID DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE "system_settings" SET "schoolId" = '00000000-0000-0000-0000-000000000001' WHERE "schoolId" IS NULL;
ALTER TABLE "system_settings" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "schoolId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "schedules_stageId_dayOfWeek_timeSlot_schoolId_key" ON "schedules"("stageId", "dayOfWeek", "timeSlot", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "stages_name_schoolId_key" ON "stages"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "students_phoneNumber_schoolId_key" ON "students"("phoneNumber", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "students_code_schoolId_key" ON "students"("code", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_stageId_schoolId_key" ON "subjects"("name", "stageId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_schoolId_key" ON "system_settings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_phoneNumber_schoolId_key" ON "teachers"("phoneNumber", "schoolId");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_posts" ADD CONSTRAINT "teacher_posts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
