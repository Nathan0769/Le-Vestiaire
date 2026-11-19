-- AlterTable
ALTER TABLE "user" ADD COLUMN "locale" TEXT;

-- reminder_step devient le jour de la dernière relance envoyée (spec 2026-11-18-relances-traduites)
-- 1 = J+7 envoyé -> 7 ; 2 = J+30 envoyé -> 30
UPDATE "user" SET "reminder_step" = CASE "reminder_step" WHEN 1 THEN 7 WHEN 2 THEN 30 ELSE "reminder_step" END
WHERE "reminder_step" IN (1, 2);

-- Langue connue des comptes iOS : celle du token push le plus récent
UPDATE "user" u SET "locale" = t."locale"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "locale"
  FROM "push_tokens"
  WHERE "locale" IN ('fr', 'en', 'es', 'de', 'pt', 'nl', 'it')
  ORDER BY "userId", "createdAt" DESC
) t
WHERE u."id" = t."userId";
