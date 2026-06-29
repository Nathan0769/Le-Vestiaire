-- CreateEnum
CREATE TYPE "PatchFamily" AS ENUM (
  'UEFA_COMPETITION',
  'CONFED_CLUB_COMPETITION',
  'FIFA_CLUB_COMPETITION',
  'DOMESTIC_LEAGUE_BADGE',
  'DOMESTIC_CHAMPION',
  'DOMESTIC_CUP',
  'DOMESTIC_SUPERCUP',
  'NATIONAL_TEAM_COMPETITION',
  'CUSTOM'
);

-- AlterTable
ALTER TABLE "user_jerseys" ADD COLUMN "hasLongSleeves" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "patches" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "family" "PatchFamily" NOT NULL,
  "leagueId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patches_family_idx" ON "patches"("family");
CREATE INDEX "patches_leagueId_idx" ON "patches"("leagueId");
CREATE INDEX "patches_isActive_idx" ON "patches"("isActive");

-- AddForeignKey
ALTER TABLE "patches" ADD CONSTRAINT "patches_leagueId_fkey"
  FOREIGN KEY ("leagueId") REFERENCES "leagues"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "patch_versions" (
  "id" TEXT NOT NULL,
  "patchId" TEXT NOT NULL,
  "seasonStart" TEXT NOT NULL,
  "seasonEnd" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patch_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patch_versions_patchId_idx" ON "patch_versions"("patchId");

-- AddForeignKey
ALTER TABLE "patch_versions" ADD CONSTRAINT "patch_versions_patchId_fkey"
  FOREIGN KEY ("patchId") REFERENCES "patches"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "user_jersey_patches" (
  "id" TEXT NOT NULL,
  "userJerseyId" TEXT NOT NULL,
  "patchId" TEXT,
  "customLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_jersey_patches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_jersey_patches_userJerseyId_patchId_key" ON "user_jersey_patches"("userJerseyId", "patchId");
CREATE INDEX "user_jersey_patches_userJerseyId_idx" ON "user_jersey_patches"("userJerseyId");
CREATE INDEX "user_jersey_patches_patchId_idx" ON "user_jersey_patches"("patchId");

-- AddForeignKey
ALTER TABLE "user_jersey_patches" ADD CONSTRAINT "user_jersey_patches_userJerseyId_fkey"
  FOREIGN KEY ("userJerseyId") REFERENCES "user_jerseys"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_jersey_patches" ADD CONSTRAINT "user_jersey_patches_patchId_fkey"
  FOREIGN KEY ("patchId") REFERENCES "patches"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
