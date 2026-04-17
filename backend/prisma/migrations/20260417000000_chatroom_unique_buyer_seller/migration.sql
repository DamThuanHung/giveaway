-- Đổi unique constraint từ (postId, buyerId) → (buyerId, sellerId)
-- Mục đích: 1 phòng chat cho mỗi cặp người mua - người bán

-- Xóa các phòng trùng, giữ lại phòng cũ nhất (có nhiều lịch sử nhất)
DELETE FROM "ChatRoom"
WHERE id NOT IN (
  SELECT DISTINCT ON ("buyerId", "sellerId") id
  FROM "ChatRoom"
  ORDER BY "buyerId", "sellerId", "createdAt" ASC
);

-- Đổi unique constraint
DROP INDEX IF EXISTS "ChatRoom_postId_buyerId_key";
CREATE UNIQUE INDEX "ChatRoom_buyerId_sellerId_key" ON "ChatRoom"("buyerId", "sellerId");
