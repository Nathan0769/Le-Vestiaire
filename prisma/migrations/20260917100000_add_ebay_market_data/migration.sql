-- CreateTable
CREATE TABLE "ebay_market_data" (
    "id" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "medianPrice" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebay_market_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ebay_market_data_jerseyId_key" ON "ebay_market_data"("jerseyId");

-- CreateIndex
CREATE INDEX "ebay_market_data_lastSeenAt_idx" ON "ebay_market_data"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "ebay_market_data" ADD CONSTRAINT "ebay_market_data_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

