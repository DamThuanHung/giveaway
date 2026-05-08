import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Reusable error state cho mobile (theo `docs/standards/UI_UX_STANDARDS.md`
/// §6 — error state phải có message rõ + retry + alternative).
/// API tương đồng với `EmptyState` (cùng widget) — IconData thay vì emoji
/// để match Material Design native feel.
class ErrorState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? subMessage;
  final VoidCallback? onRetry;

  const ErrorState({
    super.key,
    this.icon = Icons.cloud_off_outlined,
    this.message = 'Không tải được dữ liệu',
    this.subMessage = 'Có thể do mạng yếu hoặc server tạm gián đoạn. Thử lại nhé.',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppTheme.error),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            if (subMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                subMessage!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text(
                  'Thử lại',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
