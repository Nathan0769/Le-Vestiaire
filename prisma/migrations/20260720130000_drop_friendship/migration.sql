-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_senderId_fkey";

-- DropTable
DROP TABLE "friendships";

-- DropEnum
DROP TYPE "FriendshipStatus";

