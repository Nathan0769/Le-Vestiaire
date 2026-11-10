-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WISHLIST_PROMO';

-- AlterTable
ALTER TABLE "wishlist" ADD COLUMN     "flock_name" TEXT,
ADD COLUMN     "flock_number" INTEGER,
ADD COLUMN     "promo_notified_price" DECIMAL(10,2),
ADD COLUMN     "size" "Size",
ADD COLUMN     "version" "JerseyVersion";
