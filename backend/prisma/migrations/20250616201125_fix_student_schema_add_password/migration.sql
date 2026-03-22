/*
  Warnings:

  - You are about to drop the column `username` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code,schoolId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "students_username_schoolId_key";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "username",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "students_code_schoolId_key" ON "students"("code", "schoolId");
