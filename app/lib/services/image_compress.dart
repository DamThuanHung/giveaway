import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

/// Nén ảnh client-side trước khi upload.
///
/// User chụp ảnh smartphone hiện đại = 12MP ≈ 4-6MB JPEG.
/// Backend giới hạn 5MB nên có thể reject.
/// Nén về max 1920px + quality 80 → ~300-800KB, vẫn rõ nét.
///
/// Lợi ích:
/// - User 3G/4G upload nhanh hơn 5-10 lần
/// - Tiết kiệm storage MinIO ~80%
/// - Tránh reject 5MB ở backend
class ImageCompress {
  static const int _maxWidth = 1920;
  static const int _maxHeight = 1920;
  static const int _quality = 80;

  /// Nén 1 ảnh từ XFile (image_picker).
  /// Trả về XFile mới (file tạm), giữ nguyên API với code cũ.
  static Future<XFile> compress(XFile original) async {
    try {
      final bytes = await original.readAsBytes();

      // Skip nếu ảnh đã nhỏ (<500KB) — không cần nén
      if (bytes.length < 500 * 1024) return original;

      final compressed = await FlutterImageCompress.compressWithList(
        bytes,
        minWidth: _maxWidth,
        minHeight: _maxHeight,
        quality: _quality,
        format: CompressFormat.jpeg,
      );

      // Lưu vào file tạm để giữ API XFile (api_service hiện đọc qua path)
      final tmpDir = await getTemporaryDirectory();
      final tmpPath = '${tmpDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await File(tmpPath).writeAsBytes(compressed);

      if (kDebugMode) {
        final reduction = ((1 - compressed.length / bytes.length) * 100).toStringAsFixed(0);
        debugPrint('[ImageCompress] ${(bytes.length / 1024).toStringAsFixed(0)}KB → ${(compressed.length / 1024).toStringAsFixed(0)}KB (-$reduction%)');
      }

      return XFile(tmpPath);
    } catch (e) {
      // Lỗi nén → fallback ảnh gốc, để upload thử
      debugPrint('[ImageCompress] error: $e — fallback original');
      return original;
    }
  }

  /// Nén loạt ảnh song song.
  static Future<List<XFile>> compressBatch(List<XFile> originals) async {
    return Future.wait(originals.map(compress));
  }

  /// Nén buffer trực tiếp (cho avatar upload từ image_picker pickImage).
  static Future<Uint8List?> compressBytes(Uint8List bytes) async {
    if (bytes.length < 500 * 1024) return bytes;
    try {
      return await FlutterImageCompress.compressWithList(
        bytes,
        minWidth: _maxWidth,
        minHeight: _maxHeight,
        quality: _quality,
        format: CompressFormat.jpeg,
      );
    } catch (e) {
      debugPrint('[ImageCompress] bytes error: $e');
      return bytes;
    }
  }
}
