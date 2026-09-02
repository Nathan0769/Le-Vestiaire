-- AlterTable
ALTER TABLE "user" ADD COLUMN "disabled_push_types" "NotificationType"[] DEFAULT ARRAY[]::"NotificationType"[];
