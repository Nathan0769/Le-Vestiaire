-- Add ProfileVisibility enum + new User columns.
-- Runs before the backfill migration. The username column stays nullable here;
-- the NOT NULL + UNIQUE constraint is applied in the next migration after backfill.

CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "user"
  ADD COLUMN "username_generated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';
