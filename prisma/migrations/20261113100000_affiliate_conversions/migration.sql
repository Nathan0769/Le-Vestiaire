-- CreateTable
CREATE TABLE "affiliate_conversions" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "programId" TEXT,
    "amount" DECIMAL(10,2),
    "commission" DECIMAL(10,2),
    "currency" TEXT,
    "status" TEXT,
    "subId" TEXT,
    "placement" TEXT,
    "targetId" TEXT,
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affiliate_conversions_placement_idx" ON "affiliate_conversions"("placement");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_conversions_network_conversionId_key" ON "affiliate_conversions"("network", "conversionId");

