import 'package:flutter/material.dart';
import 'package:flutter/services.dart';  // HapticFeedback
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/image_compress.dart';
import '../../theme/app_theme.dart';
import '../auth/phone_login_screen.dart';
import '../post/my_posts_screen.dart';
import 'seller_stats_screen.dart';
import 'my_reviews_screen.dart';
import 'blocked_users_screen.dart';
import 'keyword_alerts_screen.dart';
import 'link_email_screen.dart';
import 'link_phone_screen.dart';
import '../favorites_tab.dart';
import '../admin/admin_dashboard_screen.dart';
import 'user_profile_screen.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/image_source_picker.dart';
import '../../widgets/user_avatar.dart';

class MyProfileScreen extends StatefulWidget {
  const MyProfileScreen({super.key});

  @override
  State<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends State<MyProfileScreen> {
  Map<String, dynamic>? _trustData;
  bool _trustLoading = true;
  bool _trustError = false;
  int _followersCount = 0;
  int _followingCount = 0;
  bool _avatarUploading = false;

  @override
  void initState() {
    super.initState();
    _loadTrust();
  }

  Future<void> _changeAvatar() async {
    final source = await showImageSourceSheet(context);
    if (source == null || !mounted) return;
    final picked = await ImagePicker().pickImage(source: source, imageQuality: 80, maxWidth: 512);
    if (picked == null || !mounted) return;
    setState(() => _avatarUploading = true);
    try {
      // Convert HEIC/HEIF (Realme/Samsung/iPhone) → JPEG trước khi upload
      // Backend chỉ accept JPEG/PNG/WebP qua magic bytes detection
      final compressed = await ImageCompress.compress(picked);
      if (!mounted) return;
      final url = await ApiService.uploadAvatar(compressed.path);
      if (!mounted) return;
      if (url != null) {
        context.read<AuthProvider>().updateAvatar(url);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đã cập nhật ảnh đại diện'),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Cập nhật ảnh thất bại'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _avatarUploading = false);
    }
  }

  Future<void> _editName() async {
    final auth = context.read<AuthProvider>();
    final ctrl = TextEditingController(text: auth.userName ?? '');
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đổi tên hiển thị'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Nhập tên mới'),
          textCapitalization: TextCapitalization.words,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
    ctrl.dispose();
    if (result == null || result.isEmpty || result == auth.userName) return;
    try {
      await ApiService.updateUser(auth.userId!, {'name': result});
      if (!mounted) return;
      auth.updateName(result);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Đã cập nhật tên'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Cập nhật tên thất bại'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _loadTrust() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) return;
    setState(() { _trustLoading = true; _trustError = false; });
    try {
      // Dùng /user/me để lấy email + phone (private). getUserById trả public profile
      // không có email/phone → hasEmail/hasPhone luôn false → hiện oan 2 nút "Liên kết".
      final results = await Future.wait([
        ApiService.getMe(),
        ApiService.getFollowCounts(auth.userId!),
      ]);
      if (!mounted) return;
      final counts = results[1] as Map<String, dynamic>;
      setState(() {
        _trustData = results[0];
        _followersCount = counts['followersCount'] ?? 0;
        _followingCount = counts['followingCount'] ?? 0;
        _trustLoading = false;
      });
    } catch (e) {
      debugPrint('❌ _loadTrust error: $e');
      if (!mounted) return;
      setState(() { _trustLoading = false; _trustError = true; });
    }
  }

  String _formatMemberSince(dynamic createdAt) {
    if (createdAt == null) return '';
    final dt = DateTime.tryParse(createdAt.toString())?.toLocal();
    if (dt == null) return '';
    return 'Thành viên từ tháng ${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(builder: (ctx, auth, _) {
      if (!auth.isAuth) {
        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Column(
            children: [
              // Header gradient
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppTheme.primary, AppTheme.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 32,
                  bottom: 32,
                  left: 24,
                  right: 24,
                ),
                child: Column(
                  children: [
                    const AppLogo(size: 64),
                    const SizedBox(height: 16),
                    const Text(
                      'Cho và Tặng',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Mua bán & trao tặng đồ cũ dễ dàng',
                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 14),
                    ),
                  ],
                ),
              ),

              // Lợi ích đăng nhập
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Đăng nhập để trải nghiệm đầy đủ',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 20),
                      const _BenefitRow(icon: Icons.post_add_outlined,     color: Color(0xFF2196F3), text: 'Đăng tin bán & tặng đồ miễn phí'),
                      const _BenefitRow(icon: Icons.chat_bubble_outline,   color: AppTheme.primary,       text: 'Nhắn tin trực tiếp với người mua/bán'),
                      const _BenefitRow(icon: Icons.favorite_border,       color: Color(0xFFE91E63), text: 'Lưu bài đăng yêu thích'),
                      const _BenefitRow(icon: Icons.people_outline,        color: Color(0xFF9C27B0), text: 'Theo dõi người bán ưa thích'),
                      const _BenefitRow(icon: Icons.star_border_rounded,   color: Color(0xFFFFC107), text: 'Đánh giá & xây dựng uy tín'),
                      const SizedBox(height: 32),

                      // Nút đăng nhập
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen(popOnSuccess: true))),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: const Text('Đăng nhập / Đăng ký', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }

      final phone = _trustData?['phone']?.toString() ?? '';
      final email = (_trustData?['email'] as String?) ?? '';
      final hasEmail = email.isNotEmpty;
      final hasPhone = phone.isNotEmpty;

      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Hồ sơ của tôi'),
        ),
        body: RefreshIndicator(
          onRefresh: _loadTrust,
          color: AppTheme.primary,
          child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Avatar + tên + email/SĐT
            Center(
              child: Column(
                children: [
                  UserAvatar(
                    imageUrl: auth.userAvatar,
                    name: auth.userName,
                    radius: 44,
                    onTap: _avatarUploading ? null : _changeAvatar,
                    badge: _avatarUploading
                        ? Container(
                            width: 24, height: 24,
                            decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                            child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                            child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                          ),
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: _editName,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(auth.userName ?? 'Người dùng',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                        const SizedBox(width: 6),
                        const Icon(Icons.edit, size: 16, color: AppTheme.textSecondary),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Hiện CẢ email + phone (nếu có), mỗi cái 1 dòng kèm icon nhỏ.
                  // Trước đây chỉ hiện 1 → user nghĩ thiếu thông tin.
                  if (hasPhone)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.phone_outlined, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 6),
                        Text(phone, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ]),
                    ),
                  if (hasEmail)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.email_outlined, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 6),
                        Text(email, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ]),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Trust badges
            if (_trustLoading)
              const SizedBox(height: 32, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)))
            else if (_trustError)
              TextButton.icon(
                onPressed: _loadTrust,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Tải lại thông tin'),
              )
            else if (_trustData != null)
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (_trustData!['isPhoneVerified'] == true)
                    const _TrustBadge(icon: Icons.verified, label: 'Đã xác minh SĐT', color: AppTheme.primary),
                  _TrustBadge(
                    icon: Icons.handshake_outlined,
                    label: '${_trustData!['completedTransactions'] ?? 0} giao dịch thành công',
                    color: AppTheme.success,
                  ),
                  if (_trustData!['createdAt'] != null)
                    _TrustBadge(
                      icon: Icons.calendar_today_outlined,
                      label: _formatMemberSince(_trustData!['createdAt']),
                      color: AppTheme.textSecondary,
                    ),
                ],
              ),
            const SizedBox(height: 16),

            // Followers / Following
            if (!_trustLoading && auth.userId != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _FollowStat(
                    count: _followersCount,
                    label: 'Người theo dõi',
                    onTap: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => _FollowListScreen(
                        userId: auth.userId!,
                        title: 'Người theo dõi tôi',
                        mode: 'followers',
                      ),
                    )),
                  ),
                  Container(width: 1, height: 36, color: AppTheme.border, margin: const EdgeInsets.symmetric(horizontal: 24)),
                  _FollowStat(
                    count: _followingCount,
                    label: 'Đang theo dõi',
                    onTap: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => _FollowListScreen(
                        userId: auth.userId!,
                        title: 'Tôi đang theo dõi',
                        mode: 'following',
                      ),
                    )),
                  ),
                ],
              ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 8),

            // Menu items
            if (auth.userRole == 'admin')
              _MenuItem(
                icon: Icons.admin_panel_settings_outlined,
                label: 'Quản trị hệ thống',
                iconBgColor: AppTheme.primary,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminDashboardScreen())),
              ),
            _MenuItem(
              icon: Icons.list_alt_outlined,
              label: 'Bài đăng của tôi',
              iconBgColor: AppTheme.primary,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPostsScreen())),
            ),
            _MenuItem(
              icon: Icons.bar_chart_outlined,
              label: 'Thống kê của tôi',
              iconBgColor: AppTheme.primary,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SellerStatsScreen())),
            ),
            _MenuItem(
              icon: Icons.favorite,
              label: 'Bài viết đã lưu',
              iconBgColor: AppTheme.primary,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoritesTab())),
            ),
            _MenuItem(
              icon: Icons.star_rounded,
              label: 'Đánh giá của tôi',
              iconBgColor: AppTheme.primary,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyReviewsScreen())),
            ),
            _MenuItem(
              icon: Icons.block,
              label: 'Danh sách đã chặn',
              iconBgColor: const Color(0xFF9E9E9E),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BlockedUsersScreen())),
            ),
            _MenuItem(
              icon: Icons.notifications_active_outlined,
              label: 'Từ khóa theo dõi',
              iconBgColor: const Color(0xFF10B981),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KeywordAlertsScreen())),
            ),
            const Divider(height: 32),
            // Liên kết phương thức dự phòng — đối xứng theo cách user đăng nhập:
            // user phone-only → liên kết email; user email-only → liên kết SĐT.
            _MenuItem(
              icon: Icons.email_rounded,
              label: hasEmail ? 'Email dự phòng (đã liên kết)' : 'Liên kết email dự phòng',
              iconBgColor: const Color(0xFF9E9E9E),
              onTap: hasEmail ? () {} : () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LinkEmailScreen()),
              ).then((ok) { if (ok == true) _loadTrust(); }),
            ),
            _MenuItem(
              icon: Icons.phone_android_rounded,
              label: hasPhone ? 'SĐT dự phòng (đã liên kết)' : 'Liên kết SĐT dự phòng',
              iconBgColor: const Color(0xFF9E9E9E),
              onTap: hasPhone ? () {} : () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LinkPhoneScreen()),
              ).then((ok) { if (ok == true) _loadTrust(); }),
            ),
            _MenuItem(
              icon: Icons.logout_rounded,
              label: 'Đăng xuất',
              iconBgColor: AppTheme.error,
              labelColor: AppTheme.error,
              onTap: () async {
                // UI_UX_STANDARDS §15 anti-pattern: bỏ "Are you sure?" cho action
                // dễ undo. Logout = login lại nhanh, không destructive data
                // → không cần confirm dialog. Chỉ SnackBar info + Haptic.
                HapticFeedback.lightImpact();
                context.read<AuthProvider>().logout();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đã đăng xuất'),
                      behavior: SnackBarBehavior.floating,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              },
            ),
            _MenuItem(
              icon: Icons.delete_forever_rounded,
              label: 'Xóa tài khoản',
              iconBgColor: const Color(0xFF7F1D1D),
              labelColor: AppTheme.error,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Xóa tài khoản'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn, bao gồm bài đăng, tin nhắn và giao dịch. Hành động này không thể hoàn tác.',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(width: double.infinity, child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Xóa tài khoản'),
                        )),
                        const SizedBox(height: 8),
                        SizedBox(width: double.infinity, child: OutlinedButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Hủy'),
                        )),
                      ],
                    ),
                  ),
                );
                if (confirm == true && context.mounted) {
                  final ok = await context.read<AuthProvider>().deleteAccount();
                  if (!ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Xóa tài khoản thất bại. Vui lòng thử lại.')),
                    );
                  }
                }
              },
            ),
          ],
        ),
        ),
      );
    });
  }
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _TrustBadge({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _MenuItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color iconBgColor;
  final Color? labelColor;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.iconBgColor,
    this.labelColor,
  });

  @override
  State<_MenuItem> createState() => _MenuItemState();
}

class _MenuItemState extends State<_MenuItem> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _rotate;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));

    _scale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.52), weight: 14),
      TweenSequenceItem(tween: Tween(begin: 0.52, end: 1.42), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.42, end: 0.88), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 0.88, end: 1.08), weight: 18),
      TweenSequenceItem(tween: Tween(begin: 1.08, end: 1.0), weight: 13),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

    _rotate = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -0.38), weight: 20),
      TweenSequenceItem(tween: Tween(begin: -0.38, end: 0.32), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.32, end: -0.14), weight: 25),
      TweenSequenceItem(tween: Tween(begin: -0.14, end: 0.06), weight: 15),
      TweenSequenceItem(tween: Tween(begin: 0.06, end: 0.0), weight: 10),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _handleTap() {
    _ctrl.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final labelC = widget.labelColor ?? AppTheme.textPrimary;
    return ListTile(
      leading: AnimatedBuilder(
        animation: _ctrl,
        builder: (_, __) => Transform.rotate(
          angle: _rotate.value,
          child: Transform.scale(
            scale: _scale.value,
            child: Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _lighten(widget.iconBgColor, 0.18),
                    widget.iconBgColor,
                  ],
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: widget.iconBgColor.withOpacity(0.45),
                    blurRadius: 7,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(widget.icon, color: Colors.white, size: 20),
            ),
          ),
        ),
      ),
      title: Text(widget.label, style: TextStyle(color: labelC, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: _handleTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
    );
  }

  /// Làm sáng màu lên một chút cho gradient top-left
  Color _lighten(Color c, double amount) {
    final hsl = HSLColor.fromColor(c);
    return hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0)).toColor();
  }
}

// ─── Widget lợi ích đăng nhập ────────────────────────────────────────────────

class _BenefitRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;
  const _BenefitRow({required this.icon, required this.color, required this.text});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(children: [
      Container(
        width: 40, height: 40,
        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 22),
      ),
      const SizedBox(width: 14),
      Expanded(child: Text(text, style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary))),
    ]),
  );
}

// ─── Widget hiển thị số followers/following có thể bấm ───────────────────────

class _FollowStat extends StatelessWidget {
  final int count;
  final String label;
  final VoidCallback onTap;

  const _FollowStat({required this.count, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(8),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Column(children: [
        Text(
          '$count',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primary),
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      ]),
    ),
  );
}

// ─── Màn danh sách Followers / Following ─────────────────────────────────────

class _FollowListScreen extends StatefulWidget {
  final String userId;
  final String title;
  final String mode; // 'followers' | 'following'

  const _FollowListScreen({required this.userId, required this.title, required this.mode});

  @override
  State<_FollowListScreen> createState() => _FollowListScreenState();
}

class _FollowListScreenState extends State<_FollowListScreen> {
  List<dynamic> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = widget.mode == 'followers'
        ? await ApiService.getFollowers(widget.userId)
        : await ApiService.getFollowing(widget.userId);
    if (mounted) setState(() { _users = data; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _users.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.people_outline, size: 56, color: Colors.grey.shade300),
                    const SizedBox(height: 12),
                    Text(
                      widget.mode == 'followers' ? 'Chưa có ai theo dõi bạn' : 'Bạn chưa theo dõi ai',
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                  ]),
                )
              : ListView.separated(
                  itemCount: _users.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, i) {
                    final u = _users[i];
                    final name = u['name'] ?? 'Người dùng';
                    final raw = u['avatar'] as String?;
                    final avatarUrl = (raw != null && raw.isNotEmpty)
                        ? (raw.startsWith('http') ? raw : '${ApiService.baseUrl}/$raw')
                        : null;
                    return ListTile(
                      leading: UserAvatar(imageUrl: avatarUrl, name: name, radius: 20),
                      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      onTap: () => Navigator.push(ctx, MaterialPageRoute(
                        builder: (_) => UserProfileScreen(userId: u['id'], userName: name),
                      )),
                    );
                  },
                ),
    );
  }
}
