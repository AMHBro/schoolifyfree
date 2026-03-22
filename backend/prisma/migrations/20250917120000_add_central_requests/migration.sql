-- CreateTable
CREATE TABLE IF NOT EXISTS "central_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "schoolId" UUID NULL,
    "schoolCode" TEXT NOT NULL,
    "teacherPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DELETE_ACCOUNT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key to schools (nullable, set null on delete)
ALTER TABLE "central_requests"
  ADD CONSTRAINT "central_requests_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_central_requests_updated_at ON "central_requests";
CREATE TRIGGER set_central_requests_updated_at
BEFORE UPDATE ON "central_requests"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Helpful index for filtering by status and createdAt
CREATE INDEX IF NOT EXISTS "idx_central_requests_status_createdAt"
  ON "central_requests"("status", "createdAt");


