-- AlterTable
ALTER TABLE "patches" ADD COLUMN "eligibleClubIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
