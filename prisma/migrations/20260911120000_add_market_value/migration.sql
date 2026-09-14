-- CreateTable
CREATE TABLE "jersey_market_values" (
    "id" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "sources" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jersey_market_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jersey_market_value_snapshots" (
    "id" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jersey_market_value_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jersey_market_values_jerseyId_key" ON "jersey_market_values"("jerseyId");

-- CreateIndex
CREATE INDEX "jersey_market_value_snapshots_jerseyId_date_idx" ON "jersey_market_value_snapshots"("jerseyId", "date");

-- AddForeignKey
ALTER TABLE "jersey_market_values" ADD CONSTRAINT "jersey_market_values_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jersey_market_value_snapshots" ADD CONSTRAINT "jersey_market_value_snapshots_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

