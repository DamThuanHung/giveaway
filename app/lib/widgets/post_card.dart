import 'package:flutter/material.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'app_image.dart';

class PostCard extends StatelessWidget {
  final Post post;
  final bool isFavorite;
  final VoidCallback? onTap;
  final VoidCallback? onToggleFavorite;

  const PostCard({
    super.key,
    required this.post,
    this.isFavorite = false,
    this.onTap,
    this.onToggleFavorite,
  });

  static String formatPrice(int price, String listingType) {
    if (listingType == 'give' || price == 0) return 'Miễn phí';
    if (price >= 1000000) {
      final tr = price / 1000000;
      final s = tr == tr.roundToDouble()
          ? '${tr.toInt()}tr'
          : '${tr.toStringAsFixed(1)}tr';
      return s;
    }
    if (price >= 1000) {
      return '${(price / 1000).round()}k';
    }
    return '${price}đ';
  }

  @override
  Widget build(BuildContext context) {
    final bool isFree = post.listingType == 'give' || post.price == 0;
    final bool isSold = post.status == 'done';
    final bool isReserved = post.status == 'reserved';

    String imgUrl = '';
    final rawUrl = post.imageUrl ?? '';
    if (rawUrl.isNotEmpty && rawUrl.startsWith('http')) {
      imgUrl = rawUrl;
    } else if (post.imageLabel.isNotEmpty) {
      imgUrl = '${ApiService.baseUrl}/uploads/${post.imageLabel}';
    }

    final String location = post.ward.isNotEmpty
        ? post.ward
        : post.district.isNotEmpty
            ? post.district
            : post.province.isNotEmpty
                ? post.province
                : '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Ảnh ─────────────────────────────────────
            Stack(
              children: [
                AppImage(
                  url: imgUrl,
                  height: 160,
                  width: double.infinity,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                ),

                // Overlay mờ khi đã bán
                if (isSold)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.45),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                      ),
                      alignment: Alignment.center,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.soldColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Đã bán / Đã tặng',
                            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),

                // Badge "Miễn phí" góc trên trái
                if (isFree && !isSold)
                  Positioned(
                    top: 0, left: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: const BoxDecoration(
                        color: AppTheme.freeColor,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(10),
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.card_giftcard, color: Colors.white, size: 12),
                          SizedBox(width: 3),
                          Text('Miễn phí', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),

                // Badge "Đang giữ" góc trên phải
                if (isReserved && !isSold)
                  Positioned(
                    top: 6, right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.warning,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Đang giữ',
                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),

                // Nút yêu thích
                if (onToggleFavorite != null)
                  Positioned(
                    bottom: 6, right: 6,
                    child: GestureDetector(
                      onTap: onToggleFavorite,
                      child: Container(
                        width: 30, height: 30,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.9),
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 4)],
                        ),
                        child: Icon(
                          isFavorite ? Icons.favorite : Icons.favorite_border,
                          size: 16,
                          color: isFavorite ? AppTheme.error : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // ─── Nội dung ─────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 7, 8, 7),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tiêu đề
                    Text(
                      post.title,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),

                    // Giá
                    Text(
                      formatPrice(post.price, post.listingType),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isFree ? AppTheme.freeColor : AppTheme.priceColor,
                      ),
                    ),
                    const SizedBox(height: 3),

                    // Vị trí
                    if (location.isNotEmpty)
                      Row(children: [
                        const Icon(Icons.location_on_outlined, size: 11, color: AppTheme.textSecondary),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            location,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ]),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
