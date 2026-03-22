-- AlterTable
ALTER TABLE "schools" ADD COLUMN "accessCode" TEXT,
ADD COLUMN "accessCodeActivated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "schools_accessCode_key" ON "schools"("accessCode");

