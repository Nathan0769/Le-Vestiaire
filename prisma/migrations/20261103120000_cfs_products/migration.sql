-- CreateTable
CREATE TABLE "cfs_products" (
    "id" TEXT NOT NULL,
    "cfsId" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "promoPrice" DECIMAL(65,30),
    "inStock" BOOLEAN NOT NULL,
    "isReference" BOOLEAN NOT NULL,
    "condition" "Condition",
    "productUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3),
    "soldPrice" DECIMAL(65,30),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cfs_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cfs_products_jerseyId_idx" ON "cfs_products"("jerseyId");

-- CreateIndex
CREATE INDEX "cfs_products_lastSeenAt_idx" ON "cfs_products"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "cfs_products_cfsId_jerseyId_key" ON "cfs_products"("cfsId", "jerseyId");

-- AddForeignKey
ALTER TABLE "cfs_products" ADD CONSTRAINT "cfs_products_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

