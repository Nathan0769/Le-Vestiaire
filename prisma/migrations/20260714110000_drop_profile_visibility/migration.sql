-- Rollback of profileVisibility. The feature turned out to be misaligned with
-- the browse-first product model: making profiles PRIVATE broke the existing
-- friend browsing flow. Keep the username unique index and username_generated
-- flag from the previous migrations, drop only the visibility bits.

ALTER TABLE "user" DROP COLUMN "profile_visibility";
DROP TYPE "ProfileVisibility";
