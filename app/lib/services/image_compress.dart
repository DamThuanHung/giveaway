import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

/// Nén ảnh client-side trước khi upload.
///
/// Backend chỉ accept JPEG/PNG/WebP (cloudinary.service.ts ALLOWED_MIME).
/// Một số máy mới (Realme/Samsung/iPhone) chụp ảnh HEIC mặc định → phải convert.
///
/// Logic:
/// - Detect format qua magic bytes (header)
/// - Nếu đã là JPEG/PNG/WebP và < 500KB → skip (giữ chất lượng gốc)
/// - Còn lại (HEIC/HEIF/lớn) → re-encode sang JPEG quality 80, max 1920x1920
class ImageCompress {
  static const int _maxWidth = 1920;
  static const int _maxHeight = 1920;
  static const int _quality = 80;
  static const int _skipSizeThreshold = 500 * 1024; // 500KB

  /// Detect format qua magic bytes của file.
  /// Trả về true nếu là JPEG/PNG/WebP (backend accept trực tiếp).
  static bool _isAcceptedFormat(Uint8List bytes) {
    if (bytes.length < 12) return false;
    // JPEG: FF D8 FF
    if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) return true;
    // WebP: RIFF....WEBP
    if (bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
        bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50) return true;
    return false;
  }

  /// Nén 1 ảnh từ XFile (image_picker).
  /// Trả về XFile mới (file tạm), giữ nguyên API với code cũ.
  static Future<XFile> compress(XFile original) async {
    final bytes = await original.readAsBytes();
    final isAccepted = _isAcceptedFormat(bytes);

    // Skip nén nếu đã đúng format VÀ nhỏ
    if (isAccepted && bytes.length < _skipSizeThreshold) return original;

    try {
      final compressed = await FlutterImageCompress.compressWithList(
        bytes,
        minWidth: _maxWidth,
        minHeight: _maxHeight,
        quality: _quality,
        format: CompressFormat.jpeg,
      );

      // Lưu file tạm với extension .jpg để mime detector backend nhận đúng image/jpeg
      final tmpDir = await getTemporaryDirectory();
      final tmpPath = '${tmpDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await File(tmpPath).writeAsBytes(compressed);

      if (kDebugMode) {
        final reduction = ((1 - compressed.length / bytes.length) * 100).toStringAsFixed(0);
        debugPrint('[ImageCompress] ${(bytes.length / 1024).toStringAsFixed(0)}KB → ${(compressed.length / 1024).toStringAsFixed(0)}KB (-$reduction%)');
      }

      return XFile(tmpPath);
    } catch (e) {
      debugPrint('[ImageCompress] error: $e');
      // Nếu input đã là JPEG/PNG/WebP thì fallback ảnh gốc OK (backend accept)
      // Nếu input là HEIC mà nén fail → throw để UI báo lỗi rõ ràng thay vì để
      // backend reject với message khó hiểu cho user
      if (isAccepted) return original;
      throw Exception('Không xử lý được ảnh (định dạng HEIC/HEIF không hỗ trợ trên thiết bị này). Vui lòng đổi cài đặt camera sang JPEG.');
    }
  }

  /// Nén loạt ảnh TUẦN TỰ (không phải song song).
  ///
  /// TM6 (Tier 2 audit): trước đây dùng `Future.wait(...)` chạy parallel:
  /// 10 ảnh × 5MB load đồng thời vào memory → 50MB+ uncompressed in-flight.
  /// Trên máy yếu (Galaxy J6, Redmi 8, 1-2GB RAM) → OOM crash app trước khi
  /// nén xong. Sequential thì chậm hơn ~2-3x nhưng KHÔNG crash.
  ///
  /// Trade-off chấp nhận:
  /// - Mạng tốt + máy mạnh: chậm hơn 2-3 giây cho 10 ảnh — không đáng kể
  /// - Mạng yếu + máy yếu: KHÔNG crash, user upload thành công thay vì mất bài
  ///
  /// Optional callback `onProgress(current, total)` để UI hiện progress bar.
  static Future<List<XFile>> compressBatch(
    List<XFile> originals, {
    void Function(int current, int total)? onProgress,
  }) async {
    final result = <XFile>[];
    for (var i = 0; i < originals.length; i++) {
      onProgress?.call(i, originals.length);
      result.add(await compress(originals[i]));
    }
    onProgress?.call(originals.length, originals.length);
    return result;
  }
}
