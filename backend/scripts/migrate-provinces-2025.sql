-- Migration: Cập nhật tên tỉnh/thành theo Nghị quyết 202/2025/QH15
-- Hiệu lực: 1/7/2025 — VN từ 63 → 34 đơn vị hành chính cấp tỉnh
--
-- Cách chạy trên production EC2:
--   1. SSH vào EC2: ssh -i <key> ubuntu@<ec2-ip>
--   2. Vào container DB hoặc psql:
--      docker exec -it <postgres-container> psql -U <user> -d <db>
--   3. \i /path/to/migrate-provinces-2025.sql
--      hoặc cat file rồi paste
--
-- IDEMPOTENT: chạy lại nhiều lần OK (CASE chỉ map tên cũ → mới, tỉnh mới giữ nguyên)
-- TƯƠNG THÍCH: chạy được trước khi deploy app v1.0.1 (data cũ tự convert)

BEGIN;

-- 1. Đếm trước migration để biết bao nhiêu record sẽ đổi
SELECT 'BEFORE migration:' AS status, province, COUNT(*) AS count
FROM "Post"
WHERE province IN (
  'Hải Dương','Quảng Nam','Bình Dương','Bà Rịa - Vũng Tàu','Sóc Trăng','Hậu Giang','Thừa Thiên Huế',
  'Hà Giang','Yên Bái','Bắc Kạn','Vĩnh Phúc','Hòa Bình','Bắc Giang','Thái Bình','Hà Nam','Nam Định',
  'Quảng Bình','Kon Tum','Bình Định','Ninh Thuận','Đắk Nông','Bình Thuận','Phú Yên','Bình Phước',
  'Long An','Bến Tre','Trà Vinh','Tiền Giang','Bạc Liêu','Kiên Giang'
)
GROUP BY province
ORDER BY count DESC;

-- 2. Update province cho 30 tỉnh cũ → tỉnh mới
UPDATE "Post" SET province = CASE province
  -- Sáp nhập vào TP trực thuộc TW
  WHEN 'Hải Dương' THEN 'Hải Phòng'
  WHEN 'Quảng Nam' THEN 'Đà Nẵng'
  WHEN 'Bình Dương' THEN 'TP. Hồ Chí Minh'
  WHEN 'Bà Rịa - Vũng Tàu' THEN 'TP. Hồ Chí Minh'
  WHEN 'Sóc Trăng' THEN 'Cần Thơ'
  WHEN 'Hậu Giang' THEN 'Cần Thơ'
  WHEN 'Thừa Thiên Huế' THEN 'Huế'
  -- Sáp nhập vào tỉnh khác
  WHEN 'Hà Giang' THEN 'Tuyên Quang'
  WHEN 'Yên Bái' THEN 'Lào Cai'
  WHEN 'Bắc Kạn' THEN 'Thái Nguyên'
  WHEN 'Vĩnh Phúc' THEN 'Phú Thọ'
  WHEN 'Hòa Bình' THEN 'Phú Thọ'
  WHEN 'Bắc Giang' THEN 'Bắc Ninh'
  WHEN 'Thái Bình' THEN 'Hưng Yên'
  WHEN 'Hà Nam' THEN 'Ninh Bình'
  WHEN 'Nam Định' THEN 'Ninh Bình'
  WHEN 'Quảng Bình' THEN 'Quảng Trị'
  WHEN 'Kon Tum' THEN 'Quảng Ngãi'
  WHEN 'Bình Định' THEN 'Gia Lai'
  WHEN 'Ninh Thuận' THEN 'Khánh Hòa'
  WHEN 'Đắk Nông' THEN 'Lâm Đồng'
  WHEN 'Bình Thuận' THEN 'Lâm Đồng'
  WHEN 'Phú Yên' THEN 'Đắk Lắk'
  WHEN 'Bình Phước' THEN 'Đồng Nai'
  WHEN 'Long An' THEN 'Tây Ninh'
  WHEN 'Bến Tre' THEN 'Vĩnh Long'
  WHEN 'Trà Vinh' THEN 'Vĩnh Long'
  WHEN 'Tiền Giang' THEN 'Đồng Tháp'
  WHEN 'Bạc Liêu' THEN 'Cà Mau'
  WHEN 'Kiên Giang' THEN 'An Giang'
  ELSE province
END
WHERE province IN (
  'Hải Dương','Quảng Nam','Bình Dương','Bà Rịa - Vũng Tàu','Sóc Trăng','Hậu Giang','Thừa Thiên Huế',
  'Hà Giang','Yên Bái','Bắc Kạn','Vĩnh Phúc','Hòa Bình','Bắc Giang','Thái Bình','Hà Nam','Nam Định',
  'Quảng Bình','Kon Tum','Bình Định','Ninh Thuận','Đắk Nông','Bình Thuận','Phú Yên','Bình Phước',
  'Long An','Bến Tre','Trà Vinh','Tiền Giang','Bạc Liêu','Kiên Giang'
);

-- 3. Verify sau migration: list tất cả province còn trong DB
SELECT 'AFTER migration:' AS status, province, COUNT(*) AS count
FROM "Post"
GROUP BY province
ORDER BY count DESC;

-- 4. Cảnh báo nếu còn province không hợp lệ (không trong list 34 mới)
SELECT 'INVALID provinces (not in 34 list):' AS status, province, COUNT(*) AS count
FROM "Post"
WHERE province != '' AND province NOT IN (
  'Hà Nội','TP. Hồ Chí Minh','Hải Phòng','Đà Nẵng','Cần Thơ','Huế',
  'An Giang','Bắc Ninh','Cà Mau','Cao Bằng','Đắk Lắk','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai',
  'Hà Tĩnh','Hưng Yên','Khánh Hòa','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Nghệ An','Ninh Bình',
  'Phú Thọ','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sơn La','Tây Ninh','Thái Nguyên','Thanh Hóa',
  'Tuyên Quang','Vĩnh Long'
)
GROUP BY province;

COMMIT;
