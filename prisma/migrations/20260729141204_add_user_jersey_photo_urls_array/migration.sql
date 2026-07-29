-- AlterTable: ajoute le tableau ordonne de paths R2 (index 0 = photo principale).
-- Expand/contract : userPhotoUrl est conserve (deprecated) et reste synchronise
-- a userPhotoUrls[0] par le code, pour ne pas casser le code prod encore en place.
ALTER TABLE "user_jerseys" ADD COLUMN "userPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill : reprend la photo unique existante dans le tableau.
UPDATE "user_jerseys"
SET "userPhotoUrls" = ARRAY["userPhotoUrl"]
WHERE "userPhotoUrl" IS NOT NULL;
