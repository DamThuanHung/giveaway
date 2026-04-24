import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'app_image.dart';

// ─── Gold constants (shared giữa Tier 2 và Tier 3) ──────────────────────────
const _kGoldDark  = Color(0xFFC9A84A);
const _kGoldLight = Color(0xFFF4D36A);
const _kGoldOrange= Color(0xFFFFa500);

class PostCard extends StatefulWidget {
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
    if (price >= 1000) return '${(price / 1000).round()}k';
    return '${price}đ';
  }

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> with TickerProviderStateMixin {
  AnimationController? _vipCtrl;
  AnimationController? _shimmerCtrl;

  @override
  void initState() {
    super.initState();
    if (widget.post.effectiveTier == 3) {
      _vipCtrl = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 3),
      )..repeat();
      _shimmerCtrl = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 4),
      )..repeat();
    }
  }

  @override
  void dispose() {
    _vipCtrl?.dispose();
    _shimmerCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final tier = post.effectiveTier;
    final bool isFree = post.listingType == 'give' || post.price == 0;
    final bool isSold = post.status == 'done';
    final bool isReserved = post.status == 'reserved';

    String imgUrl = '';
    final rawUrl = post.imageUrl ?? '';
    if (rawUrl.isNotEmpty && rawUrl.startsWith('http')) {
      imgUrl = rawUrl;
    } else if (post.imageLabel.isNotEmpty) {
      imgUrl = ApiService.buildImageUrl(post.imageLabel);
    }

    final locParts = <String>[];
    for (final s in [post.ward, post.district, post.province]) {
      if (s.isNotEmpty && (locParts.isEmpty || locParts.last != s)) locParts.add(s);
    }
    final location = locParts.join(', ');

    // Decoration tuỳ tier
    BoxDecoration cardDeco;
    if (tier == 3) {
      // VIP: glow vàng mạnh + shadow sâu, border vẽ bằng CustomPainter ở ngoài
      cardDeco = BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(color: _kGoldLight.withOpacity(0.55), blurRadius: 18, spreadRadius: 1, offset: const Offset(0, 2)),
          BoxShadow(color: _kGoldOrange.withOpacity(0.25), blurRadius: 24, spreadRadius: 2),
          BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 6, offset: const Offset(0, 3)),
        ],
      );
    } else if (tier == 2) {
      // Plus: nền vàng nhạt + viền vàng tĩnh + shadow nhẹ vàng
      cardDeco = BoxDecoration(
        color: const Color(0xFFFFFDF5), // vàng nhạt 5% — đủ thấy, không chói
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _kGoldDark, width: 1.5),
        boxShadow: [
          BoxShadow(color: _kGoldDark.withOpacity(0.18), blurRadius: 8, offset: const Offset(0, 3)),
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      );
    } else {
      cardDeco = BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      );
    }

    Widget card = Container(
      decoration: cardDeco,
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Ảnh ────────────────────────────────────────
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

              // Badge "Miễn phí" — góc trên trái
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

              // Badges boost — góc trên phải (ẩn khi reserved vì "Đang giữ" chiếm slot đó)
              if (tier >= 1 && !isSold && !isReserved)
                Positioned(
                  top: 0, right: 0,
                  child: _BoostBadge(tier: tier),
                ),

              // Badge "Đang giữ" — góc trên phải
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

              // Shimmer ánh sáng quét — chỉ trên ảnh
              if (tier == 3 && _shimmerCtrl != null && !isSold)
                Positioned.fill(
                  child: IgnorePointer(
                    child: ClipRect(
                      child: _ShimmerOverlay(controller: _shimmerCtrl!),
                    ),
                  ),
                ),

              // Sparkles VIP — overlay trên ảnh
              if (tier == 3 && _vipCtrl != null && !isSold)
                Positioned.fill(
                  child: IgnorePointer(
                    child: _SparklesOverlay(controller: _vipCtrl!),
                  ),
                ),

              // Badge thời gian + số ảnh — bottom-left
              Positioned(
                bottom: 6, left: 6,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (post.timeAgo.isNotEmpty) _ImageBadge(post.timeAgo),
                    if ((post.images?.length ?? 0) > 1) ...[
                      const SizedBox(width: 4),
                      _ImageBadge('${post.images!.length} 🖼'),
                    ],
                  ],
                ),
              ),

              // Nút yêu thích — padding nhỏ để không đè lên badge dưới ảnh
              if (widget.onToggleFavorite != null)
                Positioned(
                  bottom: 2, right: 2,
                  child: FavoriteButton(
                    isFavorite: widget.isFavorite,
                    onTap: widget.onToggleFavorite!,
                    outerPadding: 8,
                  ),
                ),
            ],
          ),

          // ─── Nội dung ──────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 7, 8, 7),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary, height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: post.isJob
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  post.price == 0 ? 'Thỏa thuận' : '${PostCard.formatPrice(post.price, 'sell')}${post.priceUnitLabel}',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (post.subTypeLabel.isNotEmpty)
                                  Text(post.subTypeLabel, style: const TextStyle(fontSize: 10, color: Color(0xFF5C6BC0)), overflow: TextOverflow.ellipsis),
                              ],
                            )
                          : Text(
                              PostCard.formatPrice(post.price, post.listingType),
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
    );

    // VIP: viền vàng chạy + glow vàng mạnh (giữ nguyên size để không phá grid)
    if (tier == 3 && _vipCtrl != null) {
      card = AnimatedBuilder(
        animation: _vipCtrl!,
        builder: (_, child) => CustomPaint(
          painter: _VipBorderPainter(_vipCtrl!.value),
          child: child,
        ),
        child: card,
      );
    }

    return GestureDetector(onTap: widget.onTap, child: card);
  }
}

// ── Boost Badge ──────────────────────────────────────────────────────────────

class _BoostBadge extends StatelessWidget {
  final int tier;
  const _BoostBadge({required this.tier});

  @override
  Widget build(BuildContext context) {
    if (tier == 3) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Color(0xFF2A2418), Color(0xFF1A1A1A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.only(topRight: Radius.circular(10), bottomLeft: Radius.circular(8)),
          border: Border(
            left: BorderSide(color: _kGoldDark, width: 0.5),
            bottom: BorderSide(color: _kGoldDark, width: 0.5),
          ),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.workspace_premium, color: _kGoldLight, size: 12),
            SizedBox(width: 3),
            Text('VIP', style: TextStyle(color: _kGoldLight, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          ],
        ),
      );
    }
    if (tier == 2) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: const BoxDecoration(
          color: Color(0xFFFEF9E7),
          borderRadius: BorderRadius.only(topRight: Radius.circular(10), bottomLeft: Radius.circular(8)),
          border: Border(
            left: BorderSide(color: _kGoldDark, width: 0.5),
            bottom: BorderSide(color: _kGoldDark, width: 0.5),
          ),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star_rounded, color: _kGoldDark, size: 12),
            SizedBox(width: 3),
            Text('Plus', style: TextStyle(color: Color(0xFF854F0B), fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }
    // Tier 1 — free bump — đối xứng với "Miễn phí"
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: const BoxDecoration(
        color: AppTheme.primary,
        borderRadius: BorderRadius.only(topRight: Radius.circular(10), bottomLeft: Radius.circular(8)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.rocket_launch, color: Colors.white, size: 12),
          SizedBox(width: 3),
          Text('Nổi bật', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

// ── VIP Animated Border Painter ──────────────────────────────────────────────

class _VipBorderPainter extends CustomPainter {
  final double t; // 0.0 → 1.0, repeating

  const _VipBorderPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    const radius = 10.0;
    const borderWidth = 2.0;
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(radius));

    final shader = SweepGradient(
      startAngle: t * 2 * pi,
      endAngle: t * 2 * pi + 2 * pi,
      colors: const [_kGoldLight, _kGoldOrange, _kGoldLight, _kGoldOrange, _kGoldLight],
    ).createShader(rect);

    canvas.drawRRect(
      rrect,
      Paint()
        ..shader = shader
        ..strokeWidth = borderWidth
        ..style = PaintingStyle.stroke,
    );
  }

  @override
  bool shouldRepaint(_VipBorderPainter old) => old.t != t;
}

// ── Sparkles Overlay ─────────────────────────────────────────────────────────

class _SparklesOverlay extends StatelessWidget {
  final AnimationController controller;
  const _SparklesOverlay({required this.controller});

  static double _opacity(double t, double phase) {
    final v = (t + phase) % 1.0;
    return sin(v * pi).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final t = controller.value;
        return Stack(
          children: [
            _spark(top: 0.12, left: 0.18, phase: 0.00, size: 12, t: t),
            _spark(top: 0.55, left: 0.72, phase: 0.17, size: 11, t: t),
            _spark(top: 0.30, left: 0.82, phase: 0.33, size: 8,  t: t),
            _spark(top: 0.75, left: 0.28, phase: 0.50, size: 10, t: t),
            _spark(top: 0.20, left: 0.60, phase: 0.67, size: 9,  t: t),
            _spark(top: 0.65, left: 0.50, phase: 0.83, size: 13, t: t),
          ],
        );
      },
    );
  }

  Widget _spark({required double top, required double left, required double phase, required double size, required double t}) {
    final opacity = _opacity(t, phase);
    return Positioned.fill(
      child: Align(
        alignment: FractionalOffset(left, top),
        child: Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: 0.3 + opacity * 0.7,
            child: Transform.rotate(
              angle: opacity * pi,
              child: Icon(Icons.star, color: _kGoldLight, size: size,
                shadows: const [
                  Shadow(color: Colors.white, blurRadius: 4),
                  Shadow(color: _kGoldOrange, blurRadius: 8),
                ]),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Shimmer Light Sweep (VIP) ────────────────────────────────────────────────

class _ShimmerOverlay extends StatelessWidget {
  final AnimationController controller;
  const _ShimmerOverlay({required this.controller});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final t = controller.value;
        // Chỉ hiện sweep trong 20% đầu chu kỳ (800ms trên 4s), còn lại ẩn
        if (t > 0.2) return const SizedBox.shrink();
        // Map t [0 → 0.2] sang progress [-0.3 → 1.3] để dải sáng quét từ trái qua phải
        final progress = -0.3 + (t / 0.2) * 1.6;
        return LayoutBuilder(
          builder: (_, c) {
            final w = c.maxWidth;
            final h = c.maxHeight;
            return Stack(children: [
              Positioned(
                left: w * progress,
                top: -h * 0.2,
                child: Transform.rotate(
                  angle: -pi / 6, // nghiêng ~30°
                  child: Container(
                    width: w * 0.35,
                    height: h * 1.4,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.white.withOpacity(0.0),
                          Colors.white.withOpacity(0.25),
                          Colors.white.withOpacity(0.0),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ]);
          },
        );
      },
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
  final double iconSize;
  final double buttonSize;

  /// Padding bên ngoài nút (cho particle burst animation)
  final double outerPadding;

  const FavoriteButton({
    super.key,
    required this.isFavorite,
    required this.onTap,
    this.iconSize = 18,
    this.buttonSize = 34,
    this.outerPadding = 30,
  });

  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton>
    with TickerProviderStateMixin {
  late final AnimationController _bounceCtrl;
  late final AnimationController _burstCtrl;

  late final Animation<double> _scale;
  late final Animation<double> _bgFlash;
  late final Animation<double> _burstProgress;
  late final Animation<double> _rippleProgress;

  @override
  void initState() {
    super.initState();

    _bounceCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));
    _scale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.68), weight: 12),
      TweenSequenceItem(tween: Tween(begin: 0.68, end: 1.80), weight: 33),
      TweenSequenceItem(tween: Tween(begin: 1.80, end: 0.85), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 0.85, end: 1.08), weight: 18),
      TweenSequenceItem(tween: Tween(begin: 1.08, end: 1.0), weight: 12),
    ]).animate(CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeOut));

    _bgFlash = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 75),
    ]).animate(_bounceCtrl);

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
    if (!widget.isFavorite) _burstCtrl.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final outer = widget.buttonSize + widget.outerPadding * 2;
    return GestureDetector(
      onTap: _handleTap,
      child: SizedBox(
        width: outer, height: outer,
        child: Stack(
          alignment: Alignment.center,
          children: [
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
      final dist = 14.0 + progress * 16.0;
      final opacity = progress < 0.45
          ? (progress / 0.45).clamp(0.0, 1.0)
          : (1 - (progress - 0.45) / 0.55).clamp(0.0, 1.0);
      final radius = (2.8 * (1 - progress * 0.5)).clamp(0.8, 2.8);
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
