import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Style nút "Theo dõi" — tham số chia theo context dùng:
/// - [compact]: chip nhỏ trên nền sáng (vd seller info trong post detail).
/// - [hero]: outlined button trên nền màu/ảnh (vd profile cover).
enum FollowButtonStyle { compact, hero }

/// Nút theo dõi/bỏ theo dõi user — dùng nhất quán mọi nơi.
///
/// Trước đây post_detail_screen và user_profile_screen mỗi chỗ tự code, label
/// và visual khác nhau ("+ Theo dõi" vs "Theo dõi", chip fill vs outlined,
/// có icon vs không icon) — gây cảm giác app không đồng nhất.
///
/// Widget này giữ:
/// - **Text giống nhau**: `Theo dõi` / `Đang theo dõi`
/// - **Icon giống nhau**: `+` chưa follow / `✓` đã follow
/// - **Behavior giống nhau**: tap → toggle, có loading state
///
/// Chỉ kích thước/màu thay đổi theo style để phù hợp context.
class FollowButton extends StatelessWidget {
  final bool isFollowing;
  final bool loading;
  final VoidCallback onTap;
  final FollowButtonStyle style;

  const FollowButton({
    super.key,
    required this.isFollowing,
    required this.loading,
    required this.onTap,
    this.style = FollowButtonStyle.compact,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      final color = style == FollowButtonStyle.hero ? Colors.white : AppTheme.primary;
      return SizedBox(
        width: 20, height: 20,
        child: CircularProgressIndicator(strokeWidth: 2, color: color),
      );
    }

    final label = isFollowing ? 'Đang theo dõi' : 'Theo dõi';
    final icon = isFollowing ? Icons.check_rounded : Icons.add_rounded;

    if (style == FollowButtonStyle.compact) {
      return GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isFollowing ? AppTheme.primaryLight : AppTheme.primary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14,
                  color: isFollowing ? AppTheme.primary : Colors.white),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: isFollowing ? AppTheme.primary : Colors.white,
              )),
            ],
          ),
        ),
      );
    }

    // hero: nền tối/ảnh — outlined trắng
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16, color: Colors.white),
      label: Text(label, style: const TextStyle(color: Colors.white, fontSize: 13)),
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: Colors.white.withOpacity(0.5)),
        backgroundColor:
            isFollowing ? Colors.white.withOpacity(0.2) : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}
