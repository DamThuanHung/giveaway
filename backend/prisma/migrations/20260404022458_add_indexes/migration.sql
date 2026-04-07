-- CreateIndex
CREATE INDEX "Deal_requesterId_idx" ON "Deal"("requesterId");

-- CreateIndex
CREATE INDEX "Deal_ownerId_idx" ON "Deal"("ownerId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_province_idx" ON "Post"("province");

-- CreateIndex
CREATE INDEX "Post_listingType_idx" ON "Post"("listingType");

-- CreateIndex
CREATE INDEX "Post_itemCategory_idx" ON "Post"("itemCategory");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_status_listingType_idx" ON "Post"("status", "listingType");

-- CreateIndex
CREATE INDEX "Post_status_itemCategory_idx" ON "Post"("status", "itemCategory");
