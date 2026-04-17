import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../auth/phone_login_screen.dart';
import 'edit_profile_screen.dart';
import '../post/my_posts_screen.dart';
import '../deal/deals_screen.dart';
import 'seller_stats_screen.dart';
import 'my_reviews_screen.dart';
import 'blocked_users_screen.dart';
import 'change_password_screen.dart';
import 'link_email_screen.dart';
import '../favorites_tab.dart';
import '../admin/admin_dashboard_screen.dart';
import 'user_profile_screen.dart';
import '../../widgets/app_logo.dart';
// Alias để tránh conflict
typedef DealsScreenImport = DealsScreen;

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

  @override
  void initState() {
    super.initState();
    _loadTrust();
  }

  Future<void> _loadTrust() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) return;
    setState(() { _trustLoading = true; _trustError = false; });
    try {
      final results = await Future.wait([
        ApiService.getUserById(auth.userId!),
        ApiService.getFollowCounts(auth.userId!),
      ]);
      if (!mounted) return;
      final counts = results[1] as Map<String, dynamic>;
      setState(() {
        _trustData = results[0] as Map<String, dynamic>?;
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
    final dt = DateTime.tryParse(createdAt.toString());
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
                      _BenefitRow(icon: Icons.post_add_outlined,     color: const Color(0xFF2196F3), text: 'Đăng tin bán & tặng đồ miễn phí'),
                      _BenefitRow(icon: Icons.chat_bubble_outline,   color: AppTheme.primary,       text: 'Nhắn tin trực tiếp với người mua/bán'),
                      _BenefitRow(icon: Icons.favorite_border,       color: const Color(0xFFE91E63), text: 'Lưu bài đăng yêu thích'),
                      _BenefitRow(icon: Icons.people_outline,        color: const Color(0xFF9C27B0), text: 'Theo dõi người bán ưa thích'),
                      _BenefitRow(icon: Icons.star_border_rounded,   color: const Color(0xFFFFC107), text: 'Đánh giá & xây dựng uy tín'),
                      const SizedBox(height: 32),

                      // Nút đăng nhập
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen())),
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

      final hasPassword = auth.userEmail != null && auth.userEmail!.isNotEmpty;
      final phone = _trustData?['phone']?.toString() ?? '';
      final subtitle = auth.userEmail?.isNotEmpty == true
          ? auth.userEmail!
          : phone;

      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Hồ sơ của tôi'),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()))
                  .then((_) => _loadTrust()),
            ),
          ],
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
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppTheme.primaryLight,
                    backgroundImage: (auth.userAvatar != null && auth.userAvatar!.isNotEmpty)
                        ? NetworkImage(auth.userAvatar!)
                        : null,
                    onBackgroundImageError: (auth.userAvatar != null && auth.userAvatar!.isNotEmpty)
                        ? (_, __) {}
                        : null,
                    child: (auth.userAvatar == null || auth.userAvatar!.isEmpty)
                        ? const Icon(Icons.person, size: 44, color: AppTheme.primary)
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(auth.userName ?? 'Người dùng',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 4),
                  if (subtitle.isNotEmpty)
                    Text(subtitle, style: const TextStyle(color: AppTheme.textSecondary)),
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
                    _TrustBadge(icon: Icons.verified, label: 'Đã xác minh SĐT', color: AppTheme.primary),
                  _TrustBadge(
                    icon: Icons.handshake_outlined,
                    label: '${_trustData!['completedDeals'] ?? 0} deal thành công',
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
                iconBgColor: const Color(0xFFFF8C00),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminDashboardScreen())),
              ),
            _MenuItem(
              icon: Icons.list_alt_outlined,
              label: 'Bài đăng của tôi',
              iconBgColor: const Color(0xFF2196F3),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPostsScreen())),
            ),
            _MenuItem(
              icon: Icons.bar_chart_outlined,
              label: 'Thống kê của tôi',
              iconBgColor: const Color(0xFF9C27B0),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SellerStatsScreen())),
            ),
            _MenuItem(
              icon: Icons.favorite,
              label: 'Bài viết đã lưu',
              iconBgColor: const Color(0xFFE91E63),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoritesTab())),
            ),
            _MenuItem(
              icon: Icons.swap_horiz_outlined,
              label: 'Giao dịch của tôi',
              iconBgColor: const Color(0xFF4CAF50),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DealsScreenImport())),
            ),
            _MenuItem(
              icon: Icons.star_rounded,
              label: 'Đánh giá của tôi',
              iconBgColor: const Color(0xFFFFC107),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyReviewsScreen())),
            ),
            _MenuItem(
              icon: Icons.block,
              label: 'Danh sách đã chặn',
              iconBgColor: const Color(0xFF9E9E9E),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BlockedUsersScreen())),
            ),
            const Divider(height: 32),
            _MenuItem(
              icon: Icons.email_rounded,
              label: _trustData?['email'] != null ? 'Email dự phòng (đã liên kết)' : 'Liên kết email dự phòng',
              iconBgColor: _trustData?['email'] != null ? const Color(0xFF00BCD4) : const Color(0xFF00ACC1),
              onTap: _trustData?['email'] != null ? () {} : () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LinkEmailScreen()),
              ).then((ok) { if (ok == true) _loadTrust(); }),
            ),
            if (hasPassword)
              _MenuItem(
                icon: Icons.lock_rounded,
                label: 'Đổi mật khẩu',
                iconBgColor: const Color(0xFF009688),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
              ),
            _MenuItem(
              icon: Icons.logout_rounded,
              label: 'Đăng xuất',
              iconBgColor: AppTheme.error,
              labelColor: AppTheme.error,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Đăng xuất'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Bạn có chắc muốn đăng xuất không?'),
                        const SizedBox(height: 20),
                        SizedBox(width: double.infinity, child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Đăng xuất'),
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
                  context.read<AuthProvider>().logout();
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
      trailing: Icon(Icons.chevron_right, color: AppTheme.textSecondary),
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
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryLight,
                        backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                        child: avatarUrl == null
                            ? Text(name[0].toUpperCase(),
                                style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold))
                            : null,
                      ),
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
