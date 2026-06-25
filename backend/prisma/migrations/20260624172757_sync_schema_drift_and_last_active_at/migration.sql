-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_postId_fkey";

-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_dealId_fkey";

-- DropIndex
DROP INDEX "Review_dealId_reviewerId_key";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "boostTier" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bumpedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedWithUserId" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "dealId",
ADD COLUMN     "postId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastActiveAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Deal";

-- CreateTable
CREATE TABLE "BumpOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payosOrderId" TEXT,
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,

    CONSTRAINT "BumpOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostView" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannedIdentity" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppDownloadLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppDownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebPushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BumpOrder_payosOrderId_key" ON "BumpOrder"("payosOrderId");

-- CreateIndex
CREATE INDEX "BumpOrder_userId_idx" ON "BumpOrder"("userId");

-- CreateIndex
CREATE INDEX "BumpOrder_postId_idx" ON "BumpOrder"("postId");

-- CreateIndex
CREATE INDEX "BumpOrder_status_idx" ON "BumpOrder"("status");

-- CreateIndex
CREATE INDEX "BumpOrder_expiredAt_idx" ON "BumpOrder"("expiredAt");

-- CreateIndex
CREATE INDEX "PostView_date_idx" ON "PostView"("date");

-- CreateIndex
CREATE INDEX "PostView_postId_date_idx" ON "PostView"("postId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_date_key" ON "PostView"("postId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BannedIdentity_email_key" ON "BannedIdentity"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BannedIdentity_phone_key" ON "BannedIdentity"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");

-- CreateIndex
CREATE INDEX "Category_enabled_sortOrder_idx" ON "Category"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_idx" ON "AdminActionLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetType_targetId_idx" ON "AdminActionLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminActionLog_createdAt_idx" ON "AdminActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AppDownloadLog_createdAt_idx" ON "AppDownloadLog"("createdAt");

-- CreateIndex
CREATE INDEX "AppDownloadLog_platform_createdAt_idx" ON "AppDownloadLog"("platform", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebPushSubscription_endpoint_key" ON "WebPushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "WebPushSubscription_userId_idx" ON "WebPushSubscription"("userId");

-- CreateIndex
CREATE INDEX "KeywordAlert_keyword_idx" ON "KeywordAlert"("keyword");

-- CreateIndex
CREATE INDEX "Post_bumpedAt_idx" ON "Post"("bumpedAt");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_postId_idx" ON "Review"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_postId_reviewerId_key" ON "Review"("postId", "reviewerId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_completedWithUserId_fkey" FOREIGN KEY ("completedWithUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BumpOrder" ADD CONSTRAINT "BumpOrder_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BumpOrder" ADD CONSTRAINT "BumpOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActionLog" ADD CONSTRAINT "AdminActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebPushSubscription" ADD CONSTRAINT "WebPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

