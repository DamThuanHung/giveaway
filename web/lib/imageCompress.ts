/**
 * Nén ảnh client-side trước khi upload — mirror app/lib/services/image_compress.dart
 * để web không gửi ảnh gốc (5-12MB từ điện thoại đời mới) gây chậm 5s+ khi đăng bài.
 *
 * Resize tối đa 1920x1920, JPEG quality 0.8. Skip nếu ảnh đã nhỏ (<500KB) và đúng
 * format JPEG/PNG/WebP — giữ chất lượng gốc, không nén lại vô ích.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const SKIP_SIZE_THRESHOLD = 500 * 1024;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function compressImage(file: File): Promise<File> {
  if (ACCEPTED_TYPES.has(file.type) && file.size < SKIP_SIZE_THRESHOLD) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // imageOrientation: "from-image" — bắt buộc chỉ định rõ vì 1 số engine cũ
    // default "none" (bỏ qua EXIF) → ảnh chụp dọc từ điện thoại bị nén ra xoay ngang.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Trình duyệt không decode được — thường do HEIC/HEIF (Chrome không hỗ trợ).
    // Format đã được backend chấp nhận thì giữ nguyên gốc, để vẫn upload được.
    if (ACCEPTED_TYPES.has(file.type)) return file;
    throw new Error(
      `Không xử lý được ảnh "${file.name}" — có thể do định dạng HEIC/HEIF. Vui lòng đổi cài đặt camera sang JPEG hoặc chọn ảnh khác.`
    );
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob || blob.size >= file.size) return file; // nén không hiệu quả → giữ gốc

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

/** Nén tuần tự (không parallel) để tránh nhiều ảnh lớn decode đồng thời ngốn RAM. */
export async function compressImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ compressed: File[]; errors: string[] }> {
  const compressed: File[] = [];
  const errors: string[] = [];
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length);
    try {
      compressed.push(await compressImage(files[i]));
    } catch (e: any) {
      errors.push(e?.message || `Lỗi xử lý ảnh "${files[i].name}"`);
    }
  }
  onProgress?.(files.length, files.length);
  return { compressed, errors };
}
