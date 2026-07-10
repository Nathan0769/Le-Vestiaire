-- CreateEnum
CREATE TYPE "CfsMatchStatus" AS ENUM ('PENDING', 'MATCHED', 'NEEDS_ALIAS', 'NO_JERSEY', 'PARSE_FAILED');

-- AlterTable
ALTER TABLE "cfs_promos" ADD COLUMN     "jerseyId" TEXT,
ADD COLUMN     "matchStatus" "CfsMatchStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "season" TEXT,
ADD COLUMN     "type" "JerseyType";

-- CreateTable
CREATE TABLE "cfs_club_aliases" (
    "id" TEXT NOT NULL,
    "cfsName" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cfs_club_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cfs_club_aliases_cfsName_key" ON "cfs_club_aliases"("cfsName");

-- CreateIndex
CREATE INDEX "cfs_club_aliases_clubId_idx" ON "cfs_club_aliases"("clubId");

-- CreateIndex
CREATE INDEX "cfs_promos_jerseyId_idx" ON "cfs_promos"("jerseyId");

-- CreateIndex
CREATE INDEX "cfs_promos_matchStatus_idx" ON "cfs_promos"("matchStatus");

-- AddForeignKey
ALTER TABLE "cfs_promos" ADD CONSTRAINT "cfs_promos_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cfs_club_aliases" ADD CONSTRAINT "cfs_club_aliases_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

