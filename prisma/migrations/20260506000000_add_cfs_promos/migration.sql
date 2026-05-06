CREATE TABLE IF NOT EXISTS "cfs_promos" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "imageUrl"     TEXT NOT NULL,
  "price"        DECIMAL(65,30) NOT NULL,
  "promoPrice"   DECIMAL(65,30) NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "club"         TEXT,
  "brand"        TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "position"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cfs_promos_pkey" PRIMARY KEY ("id")
);
