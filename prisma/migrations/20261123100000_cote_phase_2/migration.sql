-- AlterTable
ALTER TABLE "jersey_market_values" ADD COLUMN     "highValue" DOUBLE PRECISION,
ADD COLUMN     "lowValue" DOUBLE PRECISION,
ADD COLUMN     "sourceCounts" JSONB;

-- AlterTable
ALTER TABLE "ebay_market_data" ADD COLUMN     "p25Price" DOUBLE PRECISION,
ADD COLUMN     "p75Price" DOUBLE PRECISION,
ADD COLUMN     "rawMedianPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_jerseys" ADD COLUMN     "purchaseSource" TEXT;

