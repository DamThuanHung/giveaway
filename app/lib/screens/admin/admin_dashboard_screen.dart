import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/user_avatar.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _tab = 0;

  // Stats
  Map<String, dynamic>? _stats;
  bool _statsLoading = true;

  // Posts
  final List<dynamic> _posts = [];
  int _postsPage = 0;
  int _postsTotalPages = 1;
  bool _postsLoading = false;
  bool _postsInitialized = false;
  final _postSearchCtrl = TextEditingController();

  // Users
  final List<dynamic> _users = [];
  int _usersPage = 0;
  int _usersTotalPages = 1;
  bool _usersLoading = false;
  bool _usersInitialized = false;
  final _userSearchCtrl = TextEditingController();

  // Reports
  final List<dynamic> _reports = [];
  int _reportsPage = 0;
  int _reportsTotalPages = 1;
  bool _reportsLoading = false;
  bool _reportsInitialized = false;

  // Revenue
  Map<String, dynamic>? _revenue;
  final List<dynamic> _orders = [];
  final int _ordersPage = 0;
  int _ordersTotalPages = 1;
  bool _revenueLoading = false;
  bool _revenueInitialized = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  @override
  void dispose() {
    _postSearchCtrl.dispose();
    _userSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    setState(() => _statsLoading = true);
    final data = await ApiService.getAdminStats();
    if (!mounted) return;
    setState(() { _stats = data; _statsLoading = false; });
  }

  Future<void> _loadPosts({bool reset = false}) async {
    if (_postsLoading) return;
    if (reset) { _posts.clear(); _postsPage = 0; _postsTotalPages = 1; }
    if (_postsPage >= _postsTotalPages && !reset) return;
    setState(() => _postsLoading = true);
    final nextPage = _postsPage + 1;
    final search = _postSearchCtrl.text.trim();
    final result = await ApiService.adminGetPosts(
      page: nextPage,
      search: search.isNotEmpty ? search : null,
    );
    if (!mounted) return;
    final data = result['data'] as List;
    final meta = result['meta'] as Map;
    setState(() {
      _posts.addAll(data);
      _postsPage = (meta['page'] as num?)?.toInt() ?? nextPage;
      _postsTotalPages = (meta['totalPages'] as num?)?.toInt() ?? 1;
      _postsLoading = false;
      _postsInitialized = true;
    });
  }

  Future<void> _loadUsers({bool reset = false}) async {
    if (_usersLoading) return;
    if (reset) { _users.clear(); _usersPage = 0; _usersTotalPages = 1; }
    if (_usersPage >= _usersTotalPages && !reset) return;
    setState(() => _usersLoading = true);
    final nextPage = _usersPage + 1;
    final search = _userSearchCtrl.text.trim();
    final result = await ApiService.adminGetUsers(
      page: nextPage,
      search: search.isNotEmpty ? search : null,
    );
    if (!mounted) return;
    final data = result['data'] as List;
    final meta = result['meta'] as Map;
    setState(() {
      _users.addAll(data);
      _usersPage = (meta['page'] as num?)?.toInt() ?? nextPage;
      _usersTotalPages = (meta['totalPages'] as num?)?.toInt() ?? 1;
      _usersLoading = false;
      _usersInitialized = true;
    });
  }

  Future<void> _loadReports({bool reset = false}) async {
    if (_reportsLoading) return;
    if (reset) { _reports.clear(); _reportsPage = 0; _reportsTotalPages = 1; }
    if (_reportsPage >= _reportsTotalPages && !reset) return;
    setState(() => _reportsLoading = true);
    final nextPage = _reportsPage + 1;
    final result = await ApiService.adminGetReports(page: nextPage);
    if (!mounted) return;
    final data = result['data'] as List;
    final meta = result['meta'] as Map;
    setState(() {
      _reports.addAll(data);
      _reportsPage = (meta['page'] as num?)?.toInt() ?? nextPage;
      _reportsTotalPages = (meta['totalPages'] as num?)?.toInt() ?? 1;
      _reportsLoading = false;
      _reportsInitialized = true;
    });
  }

  Future<void> _loadRevenue() async {
    if (_revenueLoading) return;
    setState(() => _revenueLoading = true);
    try {
      final stats = await ApiService.adminGet('revenue');
      final orders = await ApiService.adminGet('bump-orders?page=1&limit=20');
      if (!mounted) return;
      setState(() {
        _revenue = stats;
        _orders.clear();
        _orders.addAll(orders['data'] ?? []);
        _ordersTotalPages = orders['meta']?['totalPages'] ?? 1;
        _revenueInitialized = true;
      });
    } finally {
      if (mounted) setState(() => _revenueLoading = false);
    }
  }

  void _switchTab(int tab) {
    setState(() => _tab = tab);
    if (tab == 0 && _stats == null) _loadStats();
    if (tab == 1 && !_postsInitialized) _loadPosts();
    if (tab == 2 && !_usersInitialized) _loadUsers();
    if (tab == 3 && !_reportsInitialized) _loadReports();
    if (tab == 4 && !_revenueInitialized) _loadRevenue();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Quản trị hệ thống'),
        backgroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                _TabBtn('📊 Tổng quan', 0, _tab, _switchTab),
                _TabBtn('📦 Bài đăng', 1, _tab, _switchTab),
                _TabBtn('👤 Người dùng', 2, _tab, _switchTab),
                _TabBtn('🚩 Báo cáo', 3, _tab, _switchTab),
                _TabBtn('💰 Doanh thu', 4, _tab, _switchTab),
              ]),
            ),
          ),
          const Divider(height: 1),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildContent() {
    switch (_tab) {
      case 0: return _buildStats();
      case 1: return _buildPosts();
      case 2: return _buildUsers();
      case 3: return _buildReports();
      case 4: return _buildRevenue();
      default: return const SizedBox();
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  Widget _buildStats() {
    if (_statsLoading) return const AdminListSkeleton();
    if (_stats == null) return const EmptyState(icon: Icons.error_outline, message: 'Không thể tải thống kê');

    final overview = _stats!['overview'] ?? {};
    final today = _stats!['today'] ?? {};
    final posts = _stats!['posts'] ?? {};
    final mod = _stats!['moderation'] ?? {};

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _Section('Tổng quan'),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
            children: [
              _StatTile('Người dùng', '${overview['totalUsers'] ?? 0}', Icons.people_outline, AppTheme.primary),
              _StatTile('Bài đăng', '${overview['totalPosts'] ?? 0}', Icons.article_outlined, AppTheme.success),
              _StatTile('Giao dịch', '${overview['totalDeals'] ?? 0}', Icons.swap_horiz, AppTheme.warning),
              _StatTile('Đánh giá TB', '${_stats!['avgRating'] ?? 0}⭐', Icons.star_outline, Colors.orange),
            ],
          ),
          const SizedBox(height: 20),
          const _Section('Hoạt động hôm nay'),
          const SizedBox(height: 12),
          Row(children: [
            _MiniStat('Người mới', '${today['newUsers'] ?? 0}', Colors.blue),
            const SizedBox(width: 8),
            _MiniStat('Bài mới', '${today['newPosts'] ?? 0}', Colors.green),
            const SizedBox(width: 8),
            _MiniStat('Deal mới', '${today['newDeals'] ?? 0}', Colors.orange),
          ]),
          const SizedBox(height: 20),
          const _Section('Trạng thái bài đăng'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
            child: Column(children: [
              _BarRow('Đang hiển thị', posts['available'] ?? 0, overview['totalPosts'] ?? 1, AppTheme.success),
              const SizedBox(height: 12),
              _BarRow('Đã hoàn tất', posts['done'] ?? 0, overview['totalPosts'] ?? 1, AppTheme.primary),
              const SizedBox(height: 12),
              _BarRow('Trạng thái khác', posts['other'] ?? 0, overview['totalPosts'] ?? 1, Colors.orange),
            ]),
          ),
          if ((mod['pendingReports'] ?? 0) > 0) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.shade50, borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.red),
                const SizedBox(width: 12),
                Expanded(child: Text('Có ${mod['pendingReports']} báo cáo chờ xử lý',
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold))),
                TextButton(onPressed: () => _switchTab(3), child: const Text('Xem ngay')),
              ]),
            ),
          ],
        ],
      ),
    );
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  Widget _buildPosts() {
    return Column(children: [
      _SearchBar(controller: _postSearchCtrl, hint: 'Tìm bài đăng...',
          onSearch: () => _loadPosts(reset: true)),
      Expanded(child: _buildPostsList()),
    ]);
  }

  Widget _buildPostsList() {
    if (!_postsInitialized) return const AdminListSkeleton();
    if (_posts.isEmpty) {
      return const EmptyState(icon: Icons.article_outlined, message: 'Không có bài đăng nào');
    }
    return RefreshIndicator(
      onRefresh: () => _loadPosts(reset: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _posts.length + (_postsPage < _postsTotalPages ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == _posts.length) return _LoadMoreBtn(loading: _postsLoading, onTap: _loadPosts);
          final p = _posts[i];
          return _PostCard(
            post: p,
            onHide: () async {
              await ApiService.adminHidePost(p['id']);
              _loadPosts(reset: true);
            },
            onDelete: () async {
              final ok = await _confirm('Xóa bài đăng "${p['title'] ?? ''}"?');
              if (ok) { await ApiService.adminDeletePost(p['id']); _loadPosts(reset: true); }
            },
          );
        },
      ),
    );
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  Widget _buildUsers() {
    return Column(children: [
      _SearchBar(controller: _userSearchCtrl, hint: 'Tìm người dùng...',
          onSearch: () => _loadUsers(reset: true)),
      Expanded(child: _buildUsersList()),
    ]);
  }

  Widget _buildUsersList() {
    if (!_usersInitialized) return const AdminListSkeleton();
    if (_users.isEmpty) {
      return const EmptyState(icon: Icons.people_outline, message: 'Không có người dùng nào');
    }
    return RefreshIndicator(
      onRefresh: () => _loadUsers(reset: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _users.length + (_usersPage < _usersTotalPages ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == _users.length) return _LoadMoreBtn(loading: _usersLoading, onTap: _loadUsers);
          final u = _users[i];
          final isBanned = u['isBanned'] == true;
          final isDeleted = u['deletedAt'] != null;
          final count = u['_count'] ?? {};
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDeleted ? Colors.grey.shade50 : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isBanned ? Colors.red.shade200 : isDeleted ? Colors.grey.shade300 : AppTheme.border),
            ),
            child: Row(children: [
              UserAvatar(
                imageUrl: u['avatar']?.toString(),
                name: u['name']?.toString(),
                radius: 20,
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(u['name'] ?? '', style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isDeleted ? AppTheme.textSecondary : AppTheme.textPrimary,
                  )),
                  if (u['role'] == 'admin') ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(4)),
                      child: const Text('Admin', style: TextStyle(fontSize: 10, color: Colors.purple)),
                    ),
                  ],
                  if (isDeleted) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                      child: Text('Đã xóa', style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                    ),
                  ] else if (isBanned) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(4)),
                      child: Text('Bị khóa', style: TextStyle(fontSize: 10, color: Colors.red.shade700)),
                    ),
                  ],
                ]),
                Text(u['email'] ?? u['phone'] ?? '—', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                Text('${count['posts'] ?? 0} bài  •  ${count['dealsAsRequester'] ?? 0} deal',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ])),
              if (!isDeleted && u['role'] != 'admin')
                TextButton(
                  onPressed: () async {
                    await ApiService.adminBanUser(u['id'], !isBanned);
                    _loadUsers(reset: true);
                  },
                  style: TextButton.styleFrom(foregroundColor: isBanned ? AppTheme.success : Colors.red),
                  child: Text(isBanned ? 'Mở khóa' : 'Khóa'),
                ),
            ]),
          );
        },
      ),
    );
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  Widget _buildReports() {
    if (!_reportsInitialized) return const AdminListSkeleton();
    if (_reports.isEmpty) {
      return const EmptyState(icon: Icons.flag_outlined, message: 'Không có báo cáo nào');
    }
    return RefreshIndicator(
      onRefresh: () => _loadReports(reset: true),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _reports.length + (_reportsPage < _reportsTotalPages ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == _reports.length) return _LoadMoreBtn(loading: _reportsLoading, onTap: _loadReports);
          final r = _reports[i];
          final isPending = (r['status'] ?? '') == 'pending';
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isPending ? Colors.orange.shade200 : AppTheme.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(r['post']?['title'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2)),
                _StatusChip(r['status'] ?? ''),
              ]),
              const SizedBox(height: 4),
              Text('Lý do: ${r['reason'] ?? ''}', style: const TextStyle(fontSize: 13)),
              Text('Người báo: ${r['user']?['name'] ?? ''}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              if (isPending) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(child: _AdminBtn('Ẩn bài & xử lý', Colors.orange, () async {
                    await ApiService.adminResolveReport(r['id'], 'resolved');
                    _loadReports(reset: true);
                  })),
                  const SizedBox(width: 8),
                  Expanded(child: _AdminBtn('Bỏ qua', Colors.grey, () async {
                    await ApiService.adminResolveReport(r['id'], 'dismissed');
                    _loadReports(reset: true);
                  })),
                ]),
              ],
            ]),
          );
        },
      ),
    );
  }

  Future<bool> _confirm(String message) async {
    return await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xác nhận'),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ) ?? false;
  }

  // ── Revenue tab ───────────────────────────────────────────────────────────

  Widget _buildRevenue() {
    if (_revenueLoading && !_revenueInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    final r = _revenue;
    return RefreshIndicator(
      onRefresh: _loadRevenue,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Summary cards
          Row(children: [
            Expanded(child: _StatTile('Tổng doanh thu', _formatMoney(r?['total'] ?? 0), Icons.payments_outlined, AppTheme.primary)),
            const SizedBox(width: 12),
            Expanded(child: _StatTile('Tháng này', _formatMoney(r?['thisMonth'] ?? 0), Icons.calendar_month_outlined, AppTheme.warning)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _StatTile('Hôm nay', _formatMoney(r?['today'] ?? 0), Icons.today_outlined, AppTheme.success)),
            const SizedBox(width: 12),
            Expanded(child: _StatTile('Đang boost', '${r?['activeBoosts'] ?? 0} bài', Icons.rocket_launch_outlined, const Color(0xFFC9A84A))),
          ]),
          const SizedBox(height: 16),

          // Breakdown
          const _Section('Theo gói'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              Expanded(child: _MiniStat('Plus (5k)', '${r?['breakdown']?['plus'] ?? 0} đơn', const Color(0xFF854F0B))),
              const SizedBox(width: 12),
              Expanded(child: _MiniStat('VIP (15k)', '${r?['breakdown']?['vip'] ?? 0} đơn', const Color(0xFFC9A84A))),
            ]),
          ),
          const SizedBox(height: 16),

          // Order list
          const _Section('Đơn hàng gần nhất'),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
            child: _orders.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: Text('Chưa có đơn nào', style: TextStyle(color: AppTheme.textSecondary))),
                )
              : Column(children: _orders.map((o) => _OrderTile(order: o)).toList()),
          ),
        ],
      ),
    );
  }

  String _formatMoney(dynamic amount) {
    final n = (amount as num?)?.toInt() ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}tr';
    if (n >= 1000) return '${(n / 1000).round()}k';
    return '$nđ';
  }
}

class _OrderTile extends StatelessWidget {
  final dynamic order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String? ?? '';
    final pkg = order['package'] as String? ?? '';
    final amount = order['amount'] as int? ?? 0;
    final user = order['user'];
    final post = order['post'];
    final createdAt = order['createdAt'] != null
        ? DateTime.tryParse(order['createdAt'].toString())
        : null;

    final statusColor = switch (status) {
      'paid'      => AppTheme.success,
      'pending'   => AppTheme.warning,
      'expired'   => AppTheme.textSecondary,
      'cancelled' => AppTheme.error,
      _           => AppTheme.textSecondary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppTheme.border, width: 0.5))),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post?['title'] ?? '—', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(user?['name'] ?? user?['email'] ?? '—', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(pkg == 'plus_3d' ? 'Plus 3 ngày' : 'VIP 7 ngày',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: statusColor.withOpacity(0.12), borderRadius: BorderRadius.circular(4)),
                  child: Text(status, style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(width: 6),
                Text('${(amount / 1000).round()}k', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.priceColor)),
              ]),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Post card ─────────────────────────────────────────────────────────────────

class _PostCard extends StatelessWidget {
  final Map post;
  final VoidCallback onHide;
  final VoidCallback onDelete;
  const _PostCard({required this.post, required this.onHide, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(post['title'] ?? '',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2)),
          const SizedBox(width: 8),
          _StatusChip(post['status'] ?? ''),
        ]),
        const SizedBox(height: 4),
        Text('${post['author']?['name'] ?? 'Ẩn danh'}  •  ${post['viewCount'] ?? 0} lượt xem',
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _AdminBtn('Ẩn bài', Colors.orange, onHide)),
          const SizedBox(width: 8),
          Expanded(child: _AdminBtn('Xóa', Colors.red, onDelete)),
        ]),
      ]),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final VoidCallback onSearch;
  const _SearchBar({required this.controller, required this.hint, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: TextField(
        controller: controller,
        onSubmitted: (_) => onSearch(),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textSecondary),
          suffixIcon: IconButton(
            icon: const Icon(Icons.search, size: 20, color: AppTheme.primary),
            onPressed: onSearch,
          ),
          filled: true, fillColor: AppTheme.background,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
        ),
      ),
    );
  }
}

class _LoadMoreBtn extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _LoadMoreBtn({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: loading
            ? const SizedBox(width: 24, height: 24,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
            : TextButton(
                onPressed: onTap,
                child: const Text('Tải thêm', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
              ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String text;
  const _Section(this.text);
  @override Widget build(BuildContext context) =>
      Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary));
}

class _TabBtn extends StatelessWidget {
  final String label;
  final int index, current;
  final Function(int) onTap;
  const _TabBtn(this.label, this.index, this.current, this.onTap);
  @override Widget build(BuildContext context) {
    final selected = index == current;
    return GestureDetector(
      onTap: () => onTap(index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(
            color: selected ? AppTheme.primary : Colors.transparent, width: 2))),
        child: Text(label, style: TextStyle(
          color: selected ? AppTheme.primary : AppTheme.textSecondary,
          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
        )),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatTile(this.label, this.value, this.icon, this.color);
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 22),
      const Spacer(),
      Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
      Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
    ]),
  );
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _MiniStat(this.label, this.value, this.color);
  @override Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(vertical: 12),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
    child: Column(children: [
      Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
      Text(label, style: TextStyle(fontSize: 11, color: color)),
    ]),
  ));
}

class _BarRow extends StatelessWidget {
  final String label;
  final int value, total;
  final Color color;
  const _BarRow(this.label, this.value, this.total, this.color);
  @override Widget build(BuildContext context) {
    final pct = total > 0 ? value / total : 0.0;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
        Text('$value', style: TextStyle(fontWeight: FontWeight.bold, color: color)),
      ]),
      const SizedBox(height: 4),
      ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(value: pct, color: color,
            backgroundColor: color.withOpacity(0.12), minHeight: 8)),
    ]);
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip(this.status);
  @override Widget build(BuildContext context) {
    Color c; String label;
    switch (status) {
      case 'available':  c = AppTheme.success;   label = 'Hiển thị';   break;
      case 'hidden':     c = Colors.grey;         label = 'Ẩn';         break;
      case 'done':       c = AppTheme.primary;    label = 'Xong';       break;
      case 'pending':    c = Colors.orange;       label = 'Chờ xử lý';  break;
      case 'resolved':   c = AppTheme.success;    label = 'Đã xử lý';   break;
      case 'dismissed':  c = Colors.grey;         label = 'Bỏ qua';     break;
      default:           c = Colors.grey;         label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: c.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 11, color: c, fontWeight: FontWeight.bold)),
    );
  }
}

class _AdminBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _AdminBtn(this.label, this.color, this.onTap);
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center),
    ),
  );
}
