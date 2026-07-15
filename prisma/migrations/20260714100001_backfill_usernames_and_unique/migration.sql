-- Backfill usernames for existing users, then enforce NOT NULL + UNIQUE.
-- Also flips existing users to PRIVATE (safe RGPD default). New users
-- inserted after this migration keep the schema default of PUBLIC.

-- 1. Existing users default to PRIVATE (only affects rows created before this migration ran).
UPDATE "user"
SET "profile_visibility" = 'PRIVATE';

-- 2. Normalise existing usernames to lowercase.
UPDATE "user"
SET "username" = LOWER("username")
WHERE "username" IS NOT NULL;

-- 3. Backfill NULL / empty usernames via slug of the name column, with dedup.
DO $$
DECLARE
  u RECORD;
  base_slug TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR u IN
    SELECT "id", "name" FROM "user"
    WHERE "username" IS NULL OR "username" = ''
  LOOP
    IF u."name" IS NULL OR TRIM(u."name") = '' THEN
      base_slug := 'user-' || SUBSTRING(u."id", 1, 8);
    ELSE
      base_slug := LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(u."name", '[^a-zA-Z0-9]+', '-', 'g'),
          '(^-+)|(-+$)', '', 'g'
        )
      );
      IF base_slug = '' OR LENGTH(base_slug) < 5 THEN
        base_slug := 'user-' || SUBSTRING(u."id", 1, 8);
      END IF;
      base_slug := SUBSTRING(base_slug, 1, 20);
    END IF;

    candidate := base_slug;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "user" WHERE LOWER("username") = candidate) LOOP
      candidate := SUBSTRING(base_slug, 1, GREATEST(1, 20 - LENGTH(suffix::TEXT) - 1))
                   || '-' || suffix::TEXT;
      suffix := suffix + 1;
      IF suffix > 9999 THEN
        candidate := 'user-' || SUBSTRING(u."id", 1, 12);
        EXIT;
      END IF;
    END LOOP;

    UPDATE "user"
    SET "username" = candidate,
        "username_generated" = true
    WHERE "id" = u."id";
  END LOOP;
END $$;

-- 4. Flag any legacy "user-<cuid>" style username as auto-generated so the UI can nudge personalisation.
UPDATE "user"
SET "username_generated" = true
WHERE "username" ~ '^user-[a-z0-9]{8,}$';

-- 5. Enforce NOT NULL + UNIQUE now that every row has a value.
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
