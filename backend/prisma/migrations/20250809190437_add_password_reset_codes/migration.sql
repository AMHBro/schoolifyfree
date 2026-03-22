/*
  Warnings:

  - A unique constraint covering the columns `[contactPhone]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - Made the column `contactPhone` on table `schools` required. This step will fail if there are existing NULL values in that column.

*/
-- Fix NULL contactPhone values first by setting placeholder values
-- Generate unique placeholder using MD5 hash of UUID (ensures uniqueness)
-- Extract first 4 hex digits from MD5 and convert to numeric for phone format
DO $$
DECLARE
  school_rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR school_rec IN SELECT id FROM schools WHERE "contactPhone" IS NULL LOOP
    UPDATE schools 
    SET "contactPhone" = '+000000' || LPAD((counter % 10000)::text, 4, '0')
    WHERE id = school_rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- AlterTable
ALTER TABLE "schools" ALTER COLUMN "contactPhone" SET NOT NULL;

-- CreateTable
CREATE TABLE "PasswordResetCode" (
    "id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "school_id" UUID,

    CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetCode_phone_number_idx" ON "PasswordResetCode"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "schools_contactPhone_key" ON "schools"("contactPhone");

-- AddForeignKey
ALTER TABLE "PasswordResetCode" ADD CONSTRAINT "PasswordResetCode_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
