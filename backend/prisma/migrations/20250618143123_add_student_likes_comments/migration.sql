/*
  Warnings:

  - A unique constraint covering the columns `[postId,studentId]` on the table `post_likes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "post_comments" ADD COLUMN     "studentId" UUID,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "post_likes" ADD COLUMN     "studentId" UUID,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "deployed_at" TIMESTAMP(3),
ADD COLUMN     "deployment_status" TEXT,
ADD COLUMN     "deployment_url" TEXT,
ADD COLUMN     "is_deployed" BOOLEAN DEFAULT false,
ADD COLUMN     "railway_project_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_studentId_key" ON "post_likes"("postId", "studentId");

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
