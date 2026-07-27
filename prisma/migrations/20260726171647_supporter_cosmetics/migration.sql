-- Cosmetic fields for the Supporter tier (additive, nullable).
-- Rendered only when the user is an active supporter (plan = PRO).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatar_frame" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_accent" TEXT;
