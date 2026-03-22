/*
  Warnings:

  - The `code` column on the `students` table will be renamed to `username`.
  - A unique constraint covering the columns `[username,schoolId]` on the table `students` will be added.

*/
-- DropIndex
DROP INDEX "students_code_schoolId_key";

-- AlterTable
ALTER TABLE "students" RENAME COLUMN "code" TO "username";

-- CreateIndex
CREATE UNIQUE INDEX "students_username_schoolId_key" ON "students"("username", "schoolId"); 