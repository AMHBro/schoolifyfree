/*
  Warnings:

  - You are about to drop the column `duration` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `exams` table. All the data in the column will be lost.
  - Added the required column `classNumber` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add classNumber with a default value first
ALTER TABLE "exams" ADD COLUMN "classNumber" TEXT NOT NULL DEFAULT 'Class A';

-- AlterTable: Drop the columns we don't need
ALTER TABLE "exams" DROP COLUMN "duration",
DROP COLUMN "totalMarks";

-- Remove the default value constraint since we don't want it going forward
ALTER TABLE "exams" ALTER COLUMN "classNumber" DROP DEFAULT;
