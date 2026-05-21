import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? subMessage;
  final String? actionLabel;
  final VoidCallback? onAction;
  /// Action phụ — hiển thị làm filled button bên dưới outlined button chính.
  /// Dùng cho trường hợp empty state cần 2 lối thoát (vd home: "Xem tất cả" +
  /// "Đăng bài đầu tiên") theo M-03 roadmap 2026-05-20.
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  const EmptyState({
    super.key,
    required this.icon,
    required this.message,
    this.subMessage,
    this.actionLabel,
    this.onAction,
    this.secondaryLabel,
    this.onSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppTheme.border),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (subMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                subMessage!,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: onAction,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.primary),
                  foregroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: Text(actionLabel!),
              ),
            ],
            if (secondaryLabel != null && onSecondary != null) ...[
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: onSecondary,
                icon: const Icon(Icons.add, size: 18),
                label: Text(secondaryLabel!),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  elevation: 0,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
