-- CreateTable
CREATE TABLE "cfs_availability" (
    "id" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "promoPrice" DECIMAL(65,30),
    "productUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cfs_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cfs_availability_jerseyId_key" ON "cfs_availability"("jerseyId");

-- CreateIndex
CREATE INDEX "cfs_availability_lastSeenAt_idx" ON "cfs_availability"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "cfs_availability" ADD CONSTRAINT "cfs_availability_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

