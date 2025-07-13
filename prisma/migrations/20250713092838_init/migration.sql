-- CreateEnum
CREATE TYPE "JerseyType" AS ENUM ('HOME', 'AWAY', 'THIRD', 'GOALKEEPER', 'SPECIAL');

-- CreateEnum
CREATE TYPE "Size" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('MINT', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "favoriteClubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jerseys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "type" "JerseyType" NOT NULL,
    "brand" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "retailPrice" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jerseys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_jerseys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "size" "Size",
    "condition" "Condition" NOT NULL,
    "hasTags" BOOLEAN NOT NULL DEFAULT false,
    "personalization" TEXT,
    "purchasePrice" DECIMAL(65,30),
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "userPhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_jerseys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jerseyId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "jerseys_clubId_season_type_key" ON "jerseys"("clubId", "season", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_jerseys_userId_jerseyId_key" ON "user_jerseys"("userId", "jerseyId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_userId_jerseyId_key" ON "wishlist"("userId", "jerseyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_favoriteClubId_fkey" FOREIGN KEY ("favoriteClubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jerseys" ADD CONSTRAINT "jerseys_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jerseys" ADD CONSTRAINT "user_jerseys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jerseys" ADD CONSTRAINT "user_jerseys_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
