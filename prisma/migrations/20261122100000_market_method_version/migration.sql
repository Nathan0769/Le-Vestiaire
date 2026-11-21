-- AlterTable
ALTER TABLE "jersey_market_values" ADD COLUMN     "methodVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ebay_market_data" ADD COLUMN     "methodVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "jersey_market_value_snapshots" ADD COLUMN     "methodVersion" INTEGER NOT NULL DEFAULT 1;

