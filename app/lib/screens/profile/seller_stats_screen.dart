import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class SellerStatsScreen extends StatefulWidget {
  const SellerStatsScreen({super.key});

  @override
  State<SellerStatsScreen> createState() => _SellerStatsScreenState();
}

class _SellerStatsScreenState extends State<SellerStatsScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await ApiService.getMyStats();
    if (!mounted) return;
    setState(() { _stats = data; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Thống kê của tôi')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _stats == null
              ? const Center(child: Text('Không thể tải thống kê'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // ── Tổng quan ──
                      _SectionTitle('Tổng quan'),
                      const SizedBox(height: 12),
                      Row(children: [
                        _StatCard(
                          icon: Icons.visibility_outlined,
                          label: 'Lượt xem',
                          value: _fmt(_stats!['totalViews']),
                          color: AppTheme.primary,
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          icon: Icons.favorite_border,
                          label: 'Lượt lưu',
                          value: _fmt(_stats!['totalFavorites']),
                          color: const Color(0xFFEF4444),
                        ),
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        _StatCard(
                          icon: Icons.swap_horiz_outlined,
                          label: 'Giao dịch nhận',
                          value: _fmt(_stats!['totalDeals']),
                          color: AppTheme.success,
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          icon: Icons.check_circle_outline,
                          label: 'Đã giao thành công',
                          value: _fmt(_stats!['posts']?['done']),
                          color: AppTheme.warning,
                        ),
                      ]),
                      const SizedBox(height: 24),

                      // ── Bài đăng ──
                      _SectionTitle('Bài đăng'),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(children: [
                          _PostStatRow('Tổng số bài', _fmt(_stats!['posts']?['total']), Icons.article_outlined, AppTheme.textPrimary),
                          const Divider(height: 20),
                          _PostStatRow('Đang hiển thị', _fmt(_stats!['posts']?['available']), Icons.circle, AppTheme.success),
                          const Divider(height: 20),
                          _PostStatRow('Đã hoàn tất', _fmt(_stats!['posts']?['done']), Icons.check_circle, AppTheme.primary),
                        ]),
                      ),
                    ],
                  ),
                ),
    );
  }

  String _fmt(dynamic val) {
    if (val == null) return '0';
    final n = val is int ? val : int.tryParse(val.toString()) ?? 0;
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return n.toString();
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary));
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ]),
      ),
    );
  }
}

class _PostStatRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _PostStatRow(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, color: color, size: 18),
      const SizedBox(width: 10),
      Text(label, style: const TextStyle(color: AppTheme.textSecondary)),
      const Spacer(),
      Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
    ]);
  }
}
