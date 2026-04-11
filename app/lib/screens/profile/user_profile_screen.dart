import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/post.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_image.dart';
import '../post_detail_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final String userId;
  final String? userName;

  const UserProfileScreen({super.key, required this.userId, this.userName});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  Map<String, dynamic>? _user;
  List<Post> _posts = [];
  Map<String, dynamic>? _reviews;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      ApiService.getUserById(widget.userId),
      ApiService.getUserPosts(widget.userId),
      ApiService.getUserReviews(widget.userId),
    ]);

    if (!mounted) return;

    final userData = results[0] as Map<String, dynamic>?;
    final postsData = results[1] as List<dynamic>;
    final reviewData = results[2] as Map<String, dynamic>?;

    setState(() {
      _user = userData;
      _posts = postsData.map((e) => Post.fromJson(e)).toList();
      _reviews = reviewData;
      _isLoading = false;
    });
  }

  String _formatMemberSince(dynamic createdAt) {
    if (createdAt == null) return '';
    final dt = DateTime.tryParse(createdAt.toString());
    if (dt == null) return '';
    return 'Thành viên từ tháng ${dt.month}/${dt.year}';
  }

  String _getImageUrl(Post post) {
    if (post.images != null && post.images!.isNotEmpty) return post.images!.first;
    if (post.imageLabel.isNotEmpty) return '${ApiService.baseUrl}/uploads/${post.imageLabel}';
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : CustomScrollView(
              slivers: [
                // AppBar với ảnh nền
                SliverAppBar(
                  expandedHeight: 160,
                  pinned: true,
                  backgroundColor: AppTheme.primary,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppTheme.primary, Color(0xFF1E40AF)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 40),
                          // Avatar
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            backgroundImage: (_user?['avatar'] != null && (_user!['avatar'] as String).isNotEmpty)
                                ? NetworkImage(_user!['avatar']) : null,
                            child: (_user?['avatar'] == null || (_user!['avatar'] as String).isEmpty)
                                ? Text(
                                    (_user?['name'] ?? widget.userName ?? 'U')[0].toUpperCase(),
                                    style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.bold),
                                  )
                                : null,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _user?['name'] ?? widget.userName ?? 'Người dùng',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      // Thống kê
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Row(
                          children: [
                            _StatCol('${_posts.length}', 'Bài đăng'),
                            _divider(),
                            _StatCol(
                              '${_reviews?['averageRating'] != null ? (_reviews!['averageRating'] as num).toStringAsFixed(1) : '—'}',
                              'Đánh giá TB',
                              icon: Icons.star_rounded,
                              iconColor: Colors.amber,
                            ),
                            _divider(),
                            _StatCol(
                              '${(_reviews?['reviews'] as List?)?.length ?? 0}',
                              'Lượt đánh giá',
                            ),
                          ],
                        ),
                      ),

                      // Trust badges
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (_user?['isPhoneVerified'] == true)
                              _TrustBadge(icon: Icons.verified, label: 'Đã xác minh SĐT', color: Colors.blue),
                            _TrustBadge(
                              icon: Icons.handshake_outlined,
                              label: '${_user?['completedDeals'] ?? 0} deal thành công',
                              color: AppTheme.success,
                            ),
                            if (_user?['createdAt'] != null)
                              _TrustBadge(
                                icon: Icons.calendar_today_outlined,
                                label: _formatMemberSince(_user!['createdAt']),
                                color: AppTheme.textSecondary,
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Đánh giá gần đây
                      if ((_reviews?['reviews'] as List?)?.isNotEmpty == true) ...[
                        _SectionHeader('Đánh giá gần đây'),
                        ...(_reviews!['reviews'] as List).take(3).map((r) => _ReviewTile(review: r)),
                        const SizedBox(height: 8),
                      ],

                      // Bài đăng đang hoạt động
                      _SectionHeader('Bài đăng (${_posts.length})'),
                    ],
                  ),
                ),

                // Grid bài đăng
                _posts.isEmpty
                    ? SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Center(
                            child: Column(children: [
                              Icon(Icons.article_outlined, size: 48, color: Colors.grey.shade300),
                              const SizedBox(height: 8),
                              const Text('Chưa có bài đăng nào', style: TextStyle(color: AppTheme.textSecondary)),
                            ]),
                          ),
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.all(10),
                        sliver: SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 0.72,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (ctx, i) {
                              final post = _posts[i];
                              final imgUrl = _getImageUrl(post);
                              final isFree = post.price == 0 || post.listingType == 'give';
                              return GestureDetector(
                                onTap: () => Navigator.push(ctx, MaterialPageRoute(
                                  builder: (_) => PostDetailScreen(
                                    post: post, isFavorite: false, onToggleFavorite: () async {},
                                  ),
                                )),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE5E7EB)),
                                  ),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    AppImage(url: imgUrl, height: 120, width: double.infinity,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(8))),
                                    Expanded(child: Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Text(post.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                                        const Spacer(),
                                        Text(isFree ? 'Miễn phí' : '${post.price}đ',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold,
                                            color: isFree ? Colors.red : AppTheme.primary)),
                                      ]),
                                    )),
                                  ]),
                                ),
                              );
                            },
                            childCount: _posts.length,
                          ),
                        ),
                      ),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
    );
  }

  Widget _divider() => Container(width: 1, height: 40, color: AppTheme.border);

  Widget _StatCol(String value, String label, {IconData? icon, Color? iconColor}) => Expanded(
    child: Column(children: [
      if (icon != null) ...[
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: iconColor, size: 16),
          const SizedBox(width: 4),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ]),
      ] else
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
    ]),
  );
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

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    color: Colors.white,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
  );
}

class _ReviewTile extends StatelessWidget {
  final dynamic review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    final rating = (review['rating'] as num?)?.toInt() ?? 0;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primaryLight,
            child: Text(
              (review['reviewer']?['name'] ?? 'U')[0].toUpperCase(),
              style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(review['reviewer']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
          Row(children: List.generate(5, (i) => Icon(
            i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
            color: Colors.amber, size: 14,
          ))),
        ]),
        if (review['comment'] != null && (review['comment'] as String).isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(review['comment'], style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        ],
        const Divider(height: 16),
      ]),
    );
  }
}
