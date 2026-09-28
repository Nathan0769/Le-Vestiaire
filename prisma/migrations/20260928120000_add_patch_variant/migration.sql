-- CreateEnum
CREATE TYPE "PatchVariant" AS ENUM ('UEFA_STARBALL', 'UEFA_BADGE_OF_HONOUR', 'UEFA_TITLE_HOLDER', 'UEFA_EL_TITLE_HOLDER');

-- AlterTable
ALTER TABLE "patches" ADD COLUMN     "variant" "PatchVariant";
