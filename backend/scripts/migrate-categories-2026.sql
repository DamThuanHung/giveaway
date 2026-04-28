-- Migration: Sync itemCategory cũ (backend whitelist 14 mục) → đúng key Flutter (18 mục).
-- Lý do: backend cũ có mismatch — Flutter gửi 'clothing' → backend không có → rewrite 'other'.
-- File này map lại các key tương đương để khôi phục một phần data.

-- Cách chạy:
--   ssh -i ~/.ssh/traotay-key.pem ubuntu@18.138.150.162
--   sudo -u traotay bash -c 'cat /opt/traotay/repo/backend/scripts/migrate-categories-2026.sql | docker exec -i traotay_db psql -U traotay_app -d traotay'

-- IDEMPOTENT: chạy lại OK.
-- LƯU Ý: bài đã bị rewrite thành 'other' KHÔNG thể recover (mất info gốc).
-- Chỉ recover được các bài lưu nguyên key cũ (fashion, home, services).

BEGIN;

-- 1. Đếm trước migration
SELECT 'BEFORE migration:' AS status, "itemCategory", COUNT(*) AS count
FROM "Post"
GROUP BY "itemCategory"
ORDER BY count DESC;

-- 2. Map các key backend cũ → key Flutter mới
UPDATE "Post" SET "itemCategory" = CASE "itemCategory"
  WHEN 'fashion' THEN 'clothing'      -- Thời trang
  WHEN 'home' THEN 'furniture'         -- Backend gộp Nội thất + Gia dụng → tách 'furniture' (default)
  WHEN 'services' THEN 'service'       -- Đổi plural → singular
  ELSE "itemCategory"
END
WHERE "itemCategory" IN ('fashion', 'home', 'services');

-- 3. Verify sau migration: list tất cả category còn trong DB
SELECT 'AFTER migration:' AS status, "itemCategory", COUNT(*) AS count
FROM "Post"
GROUP BY "itemCategory"
ORDER BY count DESC;

-- 4. Cảnh báo nếu còn category không hợp lệ (không trong list 18 mới)
SELECT 'INVALID categories (not in 18 list):' AS status, "itemCategory", COUNT(*) AS count
FROM "Post"
WHERE "itemCategory" NOT IN (
  'electronics','furniture','clothing','kitchen','books','toys',
  'sports','vehicles','beauty','pets','tools','food','baby',
  'music','realestate','service','jobs','other'
)
GROUP BY "itemCategory";

COMMIT;
