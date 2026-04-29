-- AlterTable: add new columns
ALTER TABLE "user_jerseys" ADD COLUMN "playerName" TEXT;
ALTER TABLE "user_jerseys" ADD COLUMN "playerNumber" INTEGER;

-- DataMigration: parse existing personalization values
-- Format expected: "NOM NUMERO" (e.g. "MESSI 10")
UPDATE "user_jerseys"
SET
  "playerName" = CASE
    WHEN "personalization" ~ '^.+ [0-9]+$'
    THEN regexp_replace("personalization", ' [0-9]+$', '')
    WHEN "personalization" IS NOT NULL AND "personalization" != ''
    THEN "personalization"
    ELSE NULL
  END,
  "playerNumber" = CASE
    WHEN "personalization" ~ '^.+ [0-9]+$'
    THEN CAST(regexp_replace("personalization", '^.* ([0-9]+)$', '\1') AS INTEGER)
    ELSE NULL
  END
WHERE "personalization" IS NOT NULL AND "personalization" != '';

-- AlterTable: drop old column
ALTER TABLE "user_jerseys" DROP COLUMN "personalization";
