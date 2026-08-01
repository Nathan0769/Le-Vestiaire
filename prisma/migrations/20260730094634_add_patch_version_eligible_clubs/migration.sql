-- AlterTable
ALTER TABLE "patch_versions" ADD COLUMN "eligibleClubIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
