-- Cài extension unaccent để tìm kiếm không dấu tiếng Việt
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Tạo wrapper function IMMUTABLE (bắt buộc để dùng trong expression index)
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
$func$
SELECT unaccent($1)
$func$;
