import 'package:flutter/material.dart';

/// Widget logo chính thức của app Trao Tay.
/// Dùng ở màn hình đăng nhập, splash, onboarding.
/// Khi đổi logo → chỉ cần cập nhật file này.
class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.25),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Text('🤝', style: TextStyle(fontSize: size * 0.55)),
      ),
    );
  }
}
