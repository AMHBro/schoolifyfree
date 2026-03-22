/*
  Warnings:

  - You are about to drop the column `title` on the `student_grades` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('MONTH_1_EXAM', 'MONTH_2_EXAM', 'MID_TERM_EXAM', 'MONTH_3_EXAM', 'MONTH_4_EXAM', 'FINAL_EXAM');

-- AlterTable
ALTER TABLE "student_grades" DROP COLUMN "title",
ADD COLUMN     "gradeType" "GradeType" NOT NULL DEFAULT 'MONTH_1_EXAM';
