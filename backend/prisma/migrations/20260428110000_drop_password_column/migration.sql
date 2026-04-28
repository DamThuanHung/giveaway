-- Bỏ cột password vì app đã chuyển hoàn toàn sang OTP-first auth (Firebase phone OTP + email OTP qua Resend)
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";
