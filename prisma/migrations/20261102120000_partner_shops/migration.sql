-- CreateEnum
CREATE TYPE "PartnerSaleKind" AS ENUM ('SOLD_OUT', 'REMOVED');

-- CreateEnum
CREATE TYPE "PartnerMatchStatus" AS ENUM ('MATCHED', 'MANUAL', 'NEEDS_ALIAS', 'PARSE_FAILED', 'NO_JERSEY', 'IGNORED');

-- CreateTable
CREATE TABLE "partner_products" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "compareAtPrice" DECIMAL(65,30),
    "available" BOOLEAN NOT NULL,
    "jerseyId" TEXT,
    "matchStatus" "PartnerMatchStatus" NOT NULL DEFAULT 'PARSE_FAILED',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "size" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "available" BOOLEAN NOT NULL,
    "availabilityChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_sales" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "jerseyId" TEXT,
    "kind" "PartnerSaleKind" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_club_aliases" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "externalName" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_club_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_products_jerseyId_idx" ON "partner_products"("jerseyId");

-- CreateIndex
CREATE INDEX "partner_products_shop_matchStatus_idx" ON "partner_products"("shop", "matchStatus");

-- CreateIndex
CREATE UNIQUE INDEX "partner_products_shop_externalId_key" ON "partner_products"("shop", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_variants_productId_externalId_key" ON "partner_variants"("productId", "externalId");

-- CreateIndex
CREATE INDEX "partner_sales_jerseyId_soldAt_idx" ON "partner_sales"("jerseyId", "soldAt");

-- CreateIndex
CREATE INDEX "partner_sales_variantId_soldAt_idx" ON "partner_sales"("variantId", "soldAt");

-- CreateIndex
CREATE INDEX "partner_club_aliases_clubId_idx" ON "partner_club_aliases"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_club_aliases_shop_externalName_key" ON "partner_club_aliases"("shop", "externalName");

-- AddForeignKey
ALTER TABLE "partner_products" ADD CONSTRAINT "partner_products_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_variants" ADD CONSTRAINT "partner_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "partner_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_sales" ADD CONSTRAINT "partner_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "partner_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_sales" ADD CONSTRAINT "partner_sales_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "partner_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_club_aliases" ADD CONSTRAINT "partner_club_aliases_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

