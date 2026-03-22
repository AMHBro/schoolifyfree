/*
  Warnings:

  - A unique constraint covering the columns `[schoolCode]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolCode` to the `schools` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add column with temporary default
ALTER TABLE "schools" ADD COLUMN "schoolCode" TEXT;

-- Step 2: Update existing schools with generated codes
UPDATE "schools" SET "schoolCode" = 'DEFAULT01' WHERE "schoolName" = 'Default School';
UPDATE "schools" SET "schoolCode" = 'TESTING01' WHERE "schoolName" = 'testing';
UPDATE "schools" SET "schoolCode" = 'TEST01' WHERE "schoolName" = 'test';

-- Step 3: Handle any remaining null values (fallback) - using a sequence instead
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT "id" FROM "schools" WHERE "schoolCode" IS NULL ORDER BY "createdAt" LOOP
        UPDATE "schools" SET "schoolCode" = 'SCHOOL' || LPAD(counter::TEXT, 2, '0') WHERE "id" = rec."id";
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 4: Make the column NOT NULL
ALTER TABLE "schools" ALTER COLUMN "schoolCode" SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "schools_schoolCode_key" ON "schools"("schoolCode");
