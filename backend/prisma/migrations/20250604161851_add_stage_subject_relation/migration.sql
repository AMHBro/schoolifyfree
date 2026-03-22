/*
  Warnings:

  - Added the required column `stageId` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/

-- First, ensure there's at least one stage for existing subjects
INSERT INTO "stages" ("id", "name", "studentCount", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), 
  'Default Stage', 
  0, 
  NOW(), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "stages" LIMIT 1);

-- Add the stageId column with a temporary default
ALTER TABLE "subjects" ADD COLUMN "stageId" UUID;

-- Update existing subjects to use the first available stage
UPDATE "subjects" 
SET "stageId" = (SELECT "id" FROM "stages" ORDER BY "createdAt" LIMIT 1)
WHERE "stageId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "subjects" ALTER COLUMN "stageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
