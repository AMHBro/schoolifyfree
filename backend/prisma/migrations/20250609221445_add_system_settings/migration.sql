-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "countryName" TEXT NOT NULL DEFAULT 'Palestine',
    "ministryName" TEXT NOT NULL DEFAULT 'Ministry of Education',
    "schoolName" TEXT NOT NULL DEFAULT 'School Name',
    "managerName" TEXT NOT NULL DEFAULT 'Manager Name',
    "studyYear" TEXT NOT NULL DEFAULT '2024-2025',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
