import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    if (listingType == 'give' || listingType == 'free') return 'Miễn phí';
    if (price == 0) return 'Thương lượng';
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

    final _locParts = <String>[];
    for (final s in [post.ward, post.district, post.province]) {
      if (s.isNotEmpty && (_locParts.isEmpty || _locParts.last != s)) _locParts.add(s);
    }
    final location = _locParts.join(', ');

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
                AspectRatio(
                  aspectRatio: 1.0,
                  child: AppImage(
                    url: imgUrl,
                    width: double.infinity,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                    thumbnail: true,
                  ),
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

                // Badge "Nổi bật" khi bài được đẩy (bumpedAt < 24h)
                if (post.isBoosted && !isSold)
                  Positioned(
                    top: 6, right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.rocket_launch, color: Colors.white, size: 10),
                          SizedBox(width: 3),
                          Text('Nổi bật', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
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

                // Badge thời gian + số ảnh — bottom-left
                Positioned(
                  bottom: 6, left: 6,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (post.timeAgo.isNotEmpty)
                        _ImageBadge(post.timeAgo),
                      if ((post.images?.length ?? 0) > 1) ...[
                        const SizedBox(width: 4),
                        _ImageBadge('${post.images!.length} 🖼'),
                      ],
                    ],
                  ),
                ),

                // Nút yêu thích
                if (onToggleFavorite != null)
                  Positioned(
                    bottom: 0, right: 0,
                    child: FavoriteButton(
                      isFavorite: isFavorite,
                      onTap: onToggleFavorite!,
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

                    // Giá + ngày đăng cùng hàng
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            formatPrice(post.price, post.listingType),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: isFree ? AppTheme.freeColor : AppTheme.priceColor,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (post.createdAt != null) ...[
                          const SizedBox(width: 4),
                          Text(
                            post.formattedDate,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),

                    // Vị trí (full width)
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

// ── Image Badge ──────────────────────────────────────────────────────────────

class _ImageBadge extends StatelessWidget {
  final String text;
  const _ImageBadge(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.55),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500)),
    );
  }
}

// ── Favorite Button ──────────────────────────────────────────────────────────

class FavoriteButton extends StatefulWidget {
  final bool isFavorite;
  final VoidCallback onTap;
  /// Kích thước icon bên trong (mặc định 18 cho PostCard, 22 cho AppBar)
  final double iconSize;
  /// Kích thước vòng tròn nút (mặc định 34 cho PostCard, 38 cho AppBar)
  final double buttonSize;

  const FavoriteButton({
    super.key,
    required this.isFavorite,
    required this.onTap,
    this.iconSize = 18,
    this.buttonSize = 34,
  });

  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton>
    with TickerProviderStateMixin {
  late final AnimationController _bounceCtrl;
  late final AnimationController _burstCtrl;

  late final Animation<double> _scale;
  late final Animation<double> _bgFlash; // 0→1→0, chỉ khi like
  late final Animation<double> _burstProgress;
  late final Animation<double> _rippleProgress;

  @override
  void initState() {
    super.initState();

    // Bounce: compress → phồng to → rung nhẹ → settle
    _bounceCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));
    _scale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.68), weight: 12),
      TweenSequenceItem(tween: Tween(begin: 0.68, end: 1.80), weight: 33),
      TweenSequenceItem(tween: Tween(begin: 1.80, end: 0.85), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 0.85, end: 1.08), weight: 18),
      TweenSequenceItem(tween: Tween(begin: 1.08, end: 1.0), weight: 12),
    ]).animate(CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeOut));

    // Flash nền trắng → hồng nhạt → trắng
    _bgFlash = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 75),
    ]).animate(_bounceCtrl);

    // Burst: particles + ripple
    _burstCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 550));
    _burstProgress = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _burstCtrl, curve: Curves.easeOut),
    );
    _rippleProgress = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _burstCtrl, curve: const Interval(0.0, 0.7, curve: Curves.easeOut)),
    );
  }

  @override
  void dispose() {
    _bounceCtrl.dispose();
    _burstCtrl.dispose();
    super.dispose();
  }

  void _handleTap() {
    HapticFeedback.mediumImpact();
    _bounceCtrl.forward(from: 0);
    if (!widget.isFavorite) {
      _burstCtrl.forward(from: 0);
    }
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final outer = widget.buttonSize + 30;
    return GestureDetector(
      onTap: _handleTap,
      child: SizedBox(
        width: outer, height: outer,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Vòng ripple lan ra
            AnimatedBuilder(
              animation: _rippleProgress,
              builder: (_, __) {
                final v = _rippleProgress.value;
                if (v <= 0) return const SizedBox.shrink();
                return Container(
                  width: widget.buttonSize + 28 * v,
                  height: widget.buttonSize + 28 * v,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.error.withOpacity((1 - v) * 0.65),
                      width: 1.8,
                    ),
                  ),
                );
              },
            ),
            // Particle burst
            AnimatedBuilder(
              animation: _burstProgress,
              builder: (_, __) => CustomPaint(
                size: Size(outer, outer),
                painter: _BurstPainter(
                  progress: _burstProgress.value,
                  color: AppTheme.error,
                  outerSize: outer,
                ),
              ),
            ),
            // Nút chính
            AnimatedBuilder(
              animation: _bgFlash,
              builder: (_, child) => ScaleTransition(
                scale: _scale,
                child: Container(
                  width: widget.buttonSize,
                  height: widget.buttonSize,
                  decoration: BoxDecoration(
                    color: Color.lerp(
                      Colors.white.withOpacity(0.92),
                      AppTheme.error.withOpacity(0.18),
                      _bgFlash.value,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 4)],
                  ),
                  child: child,
                ),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 150),
                transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                child: Icon(
                  widget.isFavorite ? Icons.favorite : Icons.favorite_border,
                  key: ValueKey(widget.isFavorite),
                  size: widget.iconSize,
                  color: widget.isFavorite ? AppTheme.error : AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Particle Burst Painter ───────────────────────────────────────────────────

class _BurstPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double outerSize;
  static const int _count = 8;

  const _BurstPainter({required this.progress, required this.color, this.outerSize = 64});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0.05 || progress >= 1.0) return;
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..style = PaintingStyle.fill;

    for (int i = 0; i < _count; i++) {
      final angle = (2 * pi / _count) * i - pi / 8;
      // Nửa đầu: hạt nhỏ bắn ra; nửa sau: fade out
      final dist = 14.0 + progress * 16.0;
      final opacity = progress < 0.45
          ? (progress / 0.45).clamp(0.0, 1.0)
          : (1 - (progress - 0.45) / 0.55).clamp(0.0, 1.0);
      final radius = (2.8 * (1 - progress * 0.5)).clamp(0.8, 2.8);

      // Xen kẽ 2 màu: đỏ và hồng nhạt
      final dotColor = i.isEven ? color : Colors.pinkAccent.shade100;
      paint.color = dotColor.withOpacity(opacity * 0.95);
      canvas.drawCircle(
        Offset(center.dx + cos(angle) * dist, center.dy + sin(angle) * dist),
        radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_BurstPainter old) => old.progress != progress;
}
