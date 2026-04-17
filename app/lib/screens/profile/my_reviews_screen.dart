import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/empty_state.dart';

class MyReviewsScreen extends StatefulWidget {
  const MyReviewsScreen({super.key});

  @override
  State<MyReviewsScreen> createState() => _MyReviewsScreenState();
}

class _MyReviewsScreenState extends State<MyReviewsScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = context.read<AuthProvider>().userId;
    if (userId == null) return;
    setState(() { _isLoading = true; _error = false; });
    try {
      final data = await ApiService.getUserReviews(userId);
      if (!mounted) return;
      setState(() { _data = data; _isLoading = false; });
    } catch (e) {
      debugPrint('❌ MyReviewsScreen._load error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _error = true; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final reviews = (_data?['reviews'] as List?) ?? [];
    final avg = (_data?['averageRating'] as num?)?.toDouble() ?? 0.0;
    final total = (_data?['totalReviews'] as num?)?.toInt() ?? 0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Đánh giá của tôi')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không tải được đánh giá', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: _load, child: const Text('Thử lại')),
                      ]),
                    )),
                  )),
                )
          : reviews.isEmpty
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: EmptyState(
                      icon: Icons.star_outline_rounded,
                      message: 'Chưa có đánh giá nào',
                      subMessage: 'Hoàn thành giao dịch để nhận đánh giá',
                    )),
                  )),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    children: [
                      // Tổng quan
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Column(children: [
                          Text(avg.toStringAsFixed(1),
                              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                          const SizedBox(height: 6),
                          Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) {
                            if (i < avg.floor()) return const Icon(Icons.star_rounded, color: Colors.amber, size: 28);
                            if (i < avg && avg - i >= 0.5) return const Icon(Icons.star_half_rounded, color: Colors.amber, size: 28);
                            return const Icon(Icons.star_outline_rounded, color: Colors.amber, size: 28);
                          })),
                          const SizedBox(height: 6),
                          Text('$total lượt đánh giá', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ]),
                      ),
                      const SizedBox(height: 8),
                      // Danh sách
                      ...reviews.map((r) => _ReviewTile(review: r)),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final dynamic review;
  const _ReviewTile({required this.review});

  String _formatDate(String? createdAt) {
    if (createdAt == null) return '';
    final dt = DateTime.tryParse(createdAt);
    if (dt == null) return '';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final rating = (review['rating'] as num?)?.toInt() ?? 0;
    final comment = review['comment']?.toString() ?? '';
    final reviewerName = review['reviewer']?['name']?.toString() ?? 'Người dùng';

    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 2),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppTheme.primaryLight,
            child: Text(
              reviewerName.isNotEmpty ? reviewerName[0].toUpperCase() : '?',
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(reviewerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            Text(_formatDate(review['createdAt']?.toString()),
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])),
          Row(children: List.generate(5, (i) => Icon(
            i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
            color: Colors.amber, size: 16,
          ))),
        ]),
        if (comment.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(comment, style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary, height: 1.4)),
        ],
      ]),
    );
  }
}
