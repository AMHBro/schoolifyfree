-- AlterTable
ALTER TABLE "activation_keys" ADD COLUMN     "studentId" UUID;

-- AddForeignKey
ALTER TABLE "activation_keys" ADD CONSTRAINT "activation_keys_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
