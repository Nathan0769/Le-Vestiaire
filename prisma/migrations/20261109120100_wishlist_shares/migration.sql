-- CreateTable
CREATE TABLE "wishlist_shares" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "jersey_ids" TEXT[],
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_reservations" (
    "id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlist_shares_user_id_idx" ON "wishlist_shares"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_reservations_wishlist_id_key" ON "gift_reservations"("wishlist_id");

-- CreateIndex
CREATE INDEX "gift_reservations_share_id_idx" ON "gift_reservations"("share_id");

-- AddForeignKey
ALTER TABLE "wishlist_shares" ADD CONSTRAINT "wishlist_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "wishlist_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
