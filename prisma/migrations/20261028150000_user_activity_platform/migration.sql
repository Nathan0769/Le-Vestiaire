-- AlterTable
ALTER TABLE "user_activity_days" DROP CONSTRAINT "user_activity_days_pkey",
ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'web',
ADD CONSTRAINT "user_activity_days_pkey" PRIMARY KEY ("user_id", "day", "platform");
