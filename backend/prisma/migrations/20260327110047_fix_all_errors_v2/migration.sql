/*
  Warnings:

  - You are about to drop the `_UserToChatRoom` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[postId,buyerId]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,postId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyerId` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postId` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_UserToChatRoom" DROP CONSTRAINT "_UserToChatRoom_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserToChatRoom" DROP CONSTRAINT "_UserToChatRoom_B_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "postId" TEXT NOT NULL,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "_UserToChatRoom";

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_postId_buyerId_key" ON "ChatRoom"("postId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_postId_key" ON "Favorite"("userId", "postId");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
