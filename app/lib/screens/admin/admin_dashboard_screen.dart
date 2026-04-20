import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;
  int _tab = 0; // 0=stats, 1=posts, 2=users, 3=reports

  // Dữ liệu các tab
  List<dynamic> _posts = [];
  List<dynamic> _users = [];
  List<dynamic> _reports = [];
  bool _tabLoading = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final data = await ApiService.getAdminStats();
    if (!mounted) return;
    setState(() { _stats = data; _isLoading = false; });
  }

  Future<void> _loadTab(int tab) async {
    setState(() { _tab = tab; _tabLoading = true; });
    if (tab == 1) {
      final r = await ApiService.adminGetPosts();
      if (mounted) setState(() { _posts = r; _tabLoading = false; });
    } else if (tab == 2) {
      final r = await ApiService.adminGetUsers();
      if (mounted) setState(() { _users = r; _tabLoading = false; });
    } else if (tab == 3) {
      final r = await ApiService.adminGetReports();
      if (mounted) setState(() { _reports = r; _tabLoading = false; });
    } else {
      _loadStats();
      setState(() => _tabLoading = false);
    }
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
          // Tab bar
          Container(
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _TabBtn('📊 Tổng quan', 0, _tab, _loadTab),
                  _TabBtn('📦 Bài đăng', 1, _tab, _loadTab),
                  _TabBtn('👤 Người dùng', 2, _tab, _loadTab),
                  _TabBtn('🚩 Báo cáo', 3, _tab, _loadTab),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          // Nội dung
          Expanded(
            child: _isLoading || _tabLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _buildContent(),
          ),
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
      default: return const SizedBox();
    }
  }

  Widget _buildStats() {
    if (_stats == null) return const Center(child: Text('Không thể tải thống kê'));
    final overview = _stats!['overview'] ?? {};
    final today = _stats!['today'] ?? {};
    final posts = _stats!['posts'] ?? {};
    final mod = _stats!['moderation'] ?? {};

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Tổng quan
          _Section('Tổng quan'),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
            children: [
              _StatTile('Người dùng', '${overview['totalUsers'] ?? 0}', Icons.people_outline, AppTheme.primary),
              _StatTile('Bài đăng', '${overview['totalPosts'] ?? 0}', Icons.article_outlined, AppTheme.success),
              _StatTile('Giao dịch', '${overview['totalDeals'] ?? 0}', Icons.swap_horiz, AppTheme.warning),
              _StatTile('Đánh giá TB', '${_stats!['avgRating'] ?? 0}⭐', Icons.star_outline, Colors.orange),
            ],
          ),
          const SizedBox(height: 20),

          // Hôm nay
          _Section('Hoạt động hôm nay'),
          const SizedBox(height: 12),
          Row(children: [
            _MiniStat('Người mới', '${today['newUsers'] ?? 0}', Colors.blue),
            const SizedBox(width: 8),
            _MiniStat('Bài mới', '${today['newPosts'] ?? 0}', Colors.green),
            const SizedBox(width: 8),
            _MiniStat('Deal mới', '${today['newDeals'] ?? 0}', Colors.orange),
          ]),
          const SizedBox(height: 20),

          // Trạng thái bài
          _Section('Trạng thái bài đăng'),
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
          const SizedBox(height: 20),

          // Kiểm duyệt
          if ((mod['pendingReports'] ?? 0) > 0)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
              child: Row(children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.red),
                const SizedBox(width: 12),
                Expanded(child: Text('Có ${mod['pendingReports']} báo cáo chờ xử lý', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold))),
                TextButton(
                  onPressed: () => _loadTab(3),
                  child: const Text('Xem ngay'),
                ),
              ]),
            ),
        ],
      ),
    );
  }

  Widget _buildPosts() {
    if (_posts.isEmpty) return const Center(child: Text('Không có bài đăng nào'));
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: _posts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final p = _posts[i];
        final status = p['status'] ?? 'available';
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(p['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 2)),
              _StatusChip(status),
            ]),
            const SizedBox(height: 4),
            Text('Người đăng: ${p['author']?['name'] ?? 'Ẩn danh'}  •  ${p['viewCount'] ?? 0} lượt xem',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: _AdminBtn('Ẩn bài', Colors.orange, () async {
                await ApiService.adminHidePost(p['id']);
                _loadTab(1);
              })),
              const SizedBox(width: 8),
              Expanded(child: _AdminBtn('Xóa', Colors.red, () async {
                final ok = await _confirm('Xóa bài đăng này?');
                if (ok) { await ApiService.adminDeletePost(p['id']); _loadTab(1); }
              })),
            ]),
          ]),
        );
      },
    );
  }

  Widget _buildUsers() {
    if (_users.isEmpty) return const Center(child: Text('Không có người dùng'));
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: _users.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final u = _users[i];
        final isBanned = u['isBanned'] == true;
        final count = u['_count'] ?? {};
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          child: Row(children: [
            CircleAvatar(
              backgroundColor: isBanned ? Colors.red.shade50 : AppTheme.primaryLight,
              child: Text((u['name'] ?? 'U')[0].toUpperCase(), style: TextStyle(color: isBanned ? Colors.red : AppTheme.primary, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(u['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                if (u['role'] == 'admin') ...[
                  const SizedBox(width: 6),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(4)),
                    child: const Text('Admin', style: TextStyle(fontSize: 10, color: Colors.purple))),
                ],
              ]),
              Text(u['email'] ?? '', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              Text('${count['posts'] ?? 0} bài  •  ${count['dealsAsRequester'] ?? 0} deal', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            ])),
            if (u['role'] != 'admin')
              TextButton(
                onPressed: () async {
                  await ApiService.adminBanUser(u['id'], !isBanned);
                  _loadTab(2);
                },
                style: TextButton.styleFrom(foregroundColor: isBanned ? AppTheme.success : Colors.red),
                child: Text(isBanned ? 'Mở khóa' : 'Khóa'),
              ),
          ]),
        );
      },
    );
  }

  Widget _buildReports() {
    if (_reports.isEmpty) return const Center(child: Text('Không có báo cáo nào'));
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: _reports.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final r = _reports[i];
        final status = r['status'] ?? 'pending';
        final isPending = status == 'pending';
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isPending ? Colors.orange.shade200 : AppTheme.border),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text('Bài: ${r['post']?['title'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 2)),
              _StatusChip(status),
            ]),
            const SizedBox(height: 4),
            Text('Lý do: ${r['reason'] ?? ''}', style: const TextStyle(fontSize: 13)),
            Text('Người báo: ${r['user']?['name'] ?? ''}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            if (isPending) ...[
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: _AdminBtn('Xử lý (ẩn bài)', Colors.orange, () async {
                  await ApiService.adminResolveReport(r['id'], 'resolved');
                  _loadTab(3);
                })),
                const SizedBox(width: 8),
                Expanded(child: _AdminBtn('Bỏ qua', Colors.grey, () async {
                  await ApiService.adminResolveReport(r['id'], 'dismissed');
                  _loadTab(3);
                })),
              ]),
            ],
          ]),
        );
      },
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
}

// ── Widgets nhỏ ───────────────────────────────────────────────

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
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: selected ? AppTheme.primary : Colors.transparent, width: 2))),
        child: Text(label, style: TextStyle(color: selected ? AppTheme.primary : AppTheme.textSecondary, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
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
        child: LinearProgressIndicator(value: pct, color: color, backgroundColor: color.withOpacity(0.12), minHeight: 8)),
    ]);
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip(this.status);
  @override Widget build(BuildContext context) {
    Color c; String label;
    switch (status) {
      case 'available': c = AppTheme.success; label = 'Hiển thị'; break;
      case 'hidden': c = Colors.grey; label = 'Ẩn'; break;
      case 'done': c = AppTheme.primary; label = 'Xong'; break;
      case 'pending': c = Colors.orange; label = 'Chờ xử lý'; break;
      case 'resolved': c = AppTheme.success; label = 'Đã xử lý'; break;
      case 'dismissed': c = Colors.grey; label = 'Bỏ qua'; break;
      default: c = Colors.grey; label = status;
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
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6), border: Border.all(color: color.withOpacity(0.3))),
      child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
    ),
  );
}
