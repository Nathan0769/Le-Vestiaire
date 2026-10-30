-- AlterTable
ALTER TABLE "user" ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "user_jerseys" ADD COLUMN     "purchaseCurrency" TEXT NOT NULL DEFAULT 'EUR';

