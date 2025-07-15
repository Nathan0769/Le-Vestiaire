/*
  Warnings:

  - A unique constraint covering the columns `[betterAuthId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "betterAuthId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_betterAuthId_key" ON "users"("betterAuthId");
