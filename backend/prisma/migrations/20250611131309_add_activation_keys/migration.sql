-- CreateTable
CREATE TABLE "activation_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "schoolId" UUID NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activation_keys_key_key" ON "activation_keys"("key");

-- AddForeignKey
ALTER TABLE "activation_keys" ADD CONSTRAINT "activation_keys_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
