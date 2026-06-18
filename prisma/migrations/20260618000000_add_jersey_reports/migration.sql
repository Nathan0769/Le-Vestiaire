-- CreateEnum
CREATE TYPE "JerseyReportCategory" AS ENUM ('LETTERING', 'SEASON', 'BRAND', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "JerseyReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "jersey_reports" (
    "id" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "JerseyReportCategory" NOT NULL,
    "description" TEXT,
    "status" "JerseyReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "jersey_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jersey_reports_jerseyId_idx" ON "jersey_reports"("jerseyId");

-- CreateIndex
CREATE INDEX "jersey_reports_userId_idx" ON "jersey_reports"("userId");

-- CreateIndex
CREATE INDEX "jersey_reports_status_idx" ON "jersey_reports"("status");

-- AddForeignKey
ALTER TABLE "jersey_reports" ADD CONSTRAINT "jersey_reports_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jersey_reports" ADD CONSTRAINT "jersey_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jersey_reports" ADD CONSTRAINT "jersey_reports_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
