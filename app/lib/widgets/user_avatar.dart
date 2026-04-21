import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double radius;
  final VoidCallback? onTap;
  final Widget? badge;

  const UserAvatar({
    super.key,
    this.imageUrl,
    this.name,
    this.radius = 24,
    this.onTap,
    this.badge,
  });

  String _initials() {
    if (name == null || name!.trim().isEmpty) return '?';
    final parts = name!.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return parts[0][0].toUpperCase();
  }

  Color _bgColor() {
    if (name == null || name!.isEmpty) return AppTheme.primary;
    final colors = [
      const Color(0xFF26A69A),
      const Color(0xFF42A5F5),
      const Color(0xFFEF5350),
      const Color(0xFFAB47BC),
      const Color(0xFFFF7043),
      const Color(0xFF66BB6A),
      const Color(0xFFEC407A),
      const Color(0xFF5C6BC0),
    ];
    return colors[name!.codeUnitAt(0) % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;

    Widget avatar = CircleAvatar(
      radius: radius,
      backgroundColor: hasImage ? Colors.grey[200] : _bgColor(),
      backgroundImage: hasImage ? NetworkImage(imageUrl!) : null,
      onBackgroundImageError: hasImage ? (_, __) {} : null,
      child: hasImage
          ? null
          : Text(
              _initials(),
              style: TextStyle(
                color: Colors.white,
                fontSize: radius * 0.7,
                fontWeight: FontWeight.bold,
              ),
            ),
    );

    if (badge != null) {
      avatar = Stack(children: [
        avatar,
        Positioned(bottom: 0, right: 0, child: badge!),
      ]);
    }

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: avatar);
    }
    return avatar;
  }
}
