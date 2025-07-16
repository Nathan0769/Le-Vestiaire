/*
  Warnings:

  - You are about to drop the column `hashedPassword` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "hashedPassword";
