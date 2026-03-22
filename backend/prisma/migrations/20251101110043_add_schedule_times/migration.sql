-- AlterTable
-- Add optional startTime and endTime columns to schedules table
-- These are nullable to ensure existing data is preserved
ALTER TABLE "schedules" ADD COLUMN "startTime" TEXT;
ALTER TABLE "schedules" ADD COLUMN "endTime" TEXT;

