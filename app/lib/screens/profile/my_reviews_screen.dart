import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class MyReviewsScreen extends StatefulWidget {
  const MyReviewsScreen({super.key});

  @override
  State<MyReviewsScreen> createState() => _MyReviewsScreenState();
}

class _MyReviewsScreenState extends State<MyReviewsScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = context.read<AuthProvider>().userId;
    if (userId == null) return;
    setState(() => _isLoading = true);
    final data = await ApiService.getUserReviews(userId);
    if (!mounted) return;
    setState(() { _data = data; _isLoading = false; });
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
          : reviews.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.star_outline_rounded, size: 72, color: AppTheme.border.withOpacity(0.5)),
                  const SizedBox(height: 16),
                  const Text('Chưa có đánh giá nào', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                  const SizedBox(height: 8),
                  const Text('Hoàn thành giao dịch để nhận đánh giá', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                ]))
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

  String _timeAgo(String? createdAt) {
    if (createdAt == null) return '';
    final dt = DateTime.tryParse(createdAt);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}/${dt.year}';
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
              reviewerName[0].toUpperCase(),
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(reviewerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            Text(_timeAgo(review['createdAt']?.toString()),
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
