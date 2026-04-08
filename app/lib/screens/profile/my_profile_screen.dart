import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';
import 'edit_profile_screen.dart';
import '../post/my_posts_screen.dart';
import '../deal/deals_screen.dart';
import 'seller_stats_screen.dart';
import 'my_reviews_screen.dart';
import 'blocked_users_screen.dart';
import 'change_password_screen.dart';
import '../favorites_tab.dart';
import '../admin/admin_dashboard_screen.dart';
// Alias để tránh conflict
typedef DealsScreenImport = DealsScreen;

class MyProfileScreen extends StatelessWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(builder: (ctx, auth, _) {
      if (!auth.isAuth) {
        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.person_outline, size: 64, color: AppTheme.textSecondary),
                const SizedBox(height: 16),
                const Text('Đăng nhập để xem hồ sơ', style: TextStyle(color: AppTheme.textSecondary)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                  child: const Text('Đăng nhập'),
                ),
              ],
            ),
          ),
        );
      }

      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Hồ sơ của tôi'),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen())),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Avatar + tên
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppTheme.primaryLight,
                    backgroundImage: (auth.userAvatar != null && auth.userAvatar!.isNotEmpty)
                        ? NetworkImage(auth.userAvatar!)
                        : null,
                    child: (auth.userAvatar == null || auth.userAvatar!.isEmpty)
                        ? const Icon(Icons.person, size: 44, color: AppTheme.primary)
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(auth.userName ?? 'Người dùng', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 4),
                  Text(auth.userEmail ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Menu items
            if (auth.userRole == 'admin')
              _MenuItem(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Quản trị hệ thống',
                color: Colors.purple,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminDashboardScreen())),
              ),
            _MenuItem(icon: Icons.list_alt_outlined, label: 'Tin đăng của tôi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPostsScreen()))),
            _MenuItem(icon: Icons.bar_chart_outlined, label: 'Thống kê của tôi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SellerStatsScreen()))),
            _MenuItem(icon: Icons.favorite_border, label: 'Tin đã lưu',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoritesTab()))),
            _MenuItem(icon: Icons.swap_horiz_outlined, label: 'Giao dịch của tôi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DealsScreenImport()))),
            _MenuItem(icon: Icons.star_outline, label: 'Đánh giá của tôi',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyReviewsScreen()))),
            _MenuItem(icon: Icons.block, label: 'Danh sách đã chặn',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BlockedUsersScreen()))),
            const Divider(height: 32),
            _MenuItem(icon: Icons.lock_outline, label: 'Đổi mật khẩu',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen()))),
            _MenuItem(
              icon: Icons.logout,
              label: 'Đăng xuất',
              color: AppTheme.error,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Đăng xuất'),
                    content: const Text('Bạn có chắc muốn đăng xuất không?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Đăng xuất', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  context.read<AuthProvider>().logout();
                }
              },
            ),
          ],
        ),
      );
    });
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _MenuItem({required this.icon, required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.textPrimary;
    return ListTile(
      leading: Icon(icon, color: c),
      title: Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
    );
  }
}
