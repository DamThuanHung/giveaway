import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AppImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final bool thumbnail;

  const AppImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.thumbnail = false,
  });

  String _optimizeUrl(String raw) {
    // Cloudinary transform (legacy)
    if (raw.contains('cloudinary.com') && raw.contains('/upload/')) {
      final params = thumbnail ? 'w_400,q_auto,f_auto' : 'w_800,q_auto,f_auto';
      return raw.replaceFirst('/upload/', '/upload/$params/');
    }
    // MinIO URL có localhost → thay bằng IP server thực (điện thoại không truy cập localhost được)
    if (raw.contains('localhost:9000') || raw.contains('127.0.0.1:9000')) {
      final serverHost = Uri.parse(ApiService.baseUrl).host;
      return raw
          .replaceAll('localhost:9000', '$serverHost:9000')
          .replaceAll('127.0.0.1:9000', '$serverHost:9000');
    }
    return raw;
  }

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) return _placeholder();

    final image = CachedNetworkImage(
      imageUrl: _optimizeUrl(url),
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => Shimmer.fromColors(
        baseColor: AppTheme.border,
        highlightColor: AppTheme.background,
        child: Container(
          width: width,
          height: height,
          color: Colors.white,
        ),
      ),
      errorWidget: (context, url, error) => _placeholder(),
    );

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: image);
    }
    return image;
  }

  Widget _placeholder() => Container(
    width: width,
    height: height,
    color: AppTheme.background,
    child: const Icon(Icons.image_outlined, color: AppTheme.border),
  );
}
