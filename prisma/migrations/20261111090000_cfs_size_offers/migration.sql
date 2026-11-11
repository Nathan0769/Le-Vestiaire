-- Meilleure offre CFS par taille, pour filtrer la wishlist par taille voulue.
ALTER TABLE "cfs_availability" ADD COLUMN "sizeOffers" JSONB;
