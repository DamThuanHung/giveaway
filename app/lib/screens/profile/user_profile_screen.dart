import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/post.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_image.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/post_card.dart';
import '../../widgets/user_avatar.dart';
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
  bool _error = false;
  bool _isFollowing = false;
  bool _followLoading = false;
  int _followersCount = 0;
  int _followingCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = false; });
    try {
      final results = await Future.wait([
        ApiService.getUserById(widget.userId),
        ApiService.getUserPosts(widget.userId),
        ApiService.getUserReviews(widget.userId),
        ApiService.getFollowStatus(widget.userId),
        ApiService.getFollowCounts(widget.userId),
      ]);
      if (!mounted) return;
      final counts = results[4] as Map<String, dynamic>;
      setState(() {
        _user = results[0] as Map<String, dynamic>?;
        _posts = (results[1] as List<dynamic>).map((e) => Post.fromJson(e)).toList();
        _reviews = results[2] as Map<String, dynamic>?;
        _isFollowing = results[3] as bool;
        _followersCount = counts['followersCount'] ?? 0;
        _followingCount = counts['followingCount'] ?? 0;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ UserProfileScreen._load error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _error = true; });
    }
  }

  Future<void> _toggleFollow() async {
    if (_followLoading) return;
    setState(() => _followLoading = true);
    final success = _isFollowing
        ? await ApiService.unfollowUser(widget.userId)
        : await ApiService.followUser(widget.userId);
    if (mounted && success) {
      setState(() {
        _isFollowing = !_isFollowing;
        _followersCount += _isFollowing ? 1 : -1;
      });
    }
    if (mounted) setState(() => _followLoading = false);
  }

  String _formatMemberSince(dynamic createdAt) {
    if (createdAt == null) return '';
    final dt = DateTime.tryParse(createdAt.toString())?.toLocal();
    if (dt == null) return '';
    return 'Thành viên từ tháng ${dt.month}/${dt.year}';
  }

  String _getImageUrl(Post post) {
    if (post.images != null && post.images!.isNotEmpty) return post.images!.first;
    if (post.imageLabel.isNotEmpty) return ApiService.buildImageUrl(post.imageLabel);
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading
          ? const UserProfileSkeleton()
          : _error
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không tải được thông tin', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: _load, child: const Text('Thử lại')),
                      ]),
                    )),
                  )),
                )
          : RefreshIndicator(
              onRefresh: _load,
              child: CustomScrollView(
              slivers: [
                // AppBar với ảnh nền
                SliverAppBar(
                  expandedHeight: 200,
                  pinned: true,
                  backgroundColor: AppTheme.primary,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppTheme.primary, AppTheme.primaryDark],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 40),
                          // Avatar
                          Builder(builder: (_) {
                            final raw = _user?['avatar'] as String?;
                            final avatarUrl = (raw != null && raw.isNotEmpty)
                                ? (raw.startsWith('http') ? raw : '${ApiService.baseUrl}/$raw')
                                : null;
                            final initials = (_user?['name'] ?? widget.userName ?? 'U')[0].toUpperCase();
                            return Container(
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.2),
                              ),
                              child: ClipOval(
                                child: avatarUrl != null
                                    ? CachedNetworkImage(
                                        imageUrl: avatarUrl,
                                        fit: BoxFit.cover,
                                        errorWidget: (_, __, ___) => Center(
                                          child: Text(initials,
                                            style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold)),
                                        ),
                                      )
                                    : Center(
                                        child: Text(initials,
                                          style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold)),
                                      ),
                              ),
                            );
                          }),
                          const SizedBox(height: 8),
                          // Tên + badge xác minh
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _user?['name'] ?? widget.userName ?? 'Người dùng',
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              if (_user?['isPhoneVerified'] == true) ...[
                                const SizedBox(width: 6),
                                const Icon(Icons.verified_rounded, color: Colors.white, size: 16),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          // Thành viên từ
                          if (_user?['createdAt'] != null)
                            Text(
                              _formatMemberSince(_user!['createdAt']),
                              style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12),
                            ),
                          const SizedBox(height: 12),
                          // Nút Theo dõi
                          _followLoading
                              ? const SizedBox(
                                  width: 20, height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : OutlinedButton.icon(
                                  onPressed: _toggleFollow,
                                  icon: Icon(
                                    _isFollowing ? Icons.check_rounded : Icons.add_rounded,
                                    size: 16,
                                    color: _isFollowing ? Colors.white : Colors.white,
                                  ),
                                  label: Text(
                                    _isFollowing ? 'Đang theo dõi' : 'Theo dõi',
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Colors.white70),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    backgroundColor: _isFollowing
                                        ? Colors.white.withOpacity(0.2)
                                        : Colors.transparent,
                                  ),
                                ),
                        ],
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      // Thống kê — 2 hàng x 3 cột
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Column(
                          children: [
                            // Hàng 1: Bài đăng | Đánh giá TB | Deal xong
                            Row(
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
                                  '${_user?['completedDeals'] ?? 0}',
                                  'Deal xong',
                                  icon: Icons.handshake_outlined,
                                  iconColor: AppTheme.success,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Divider(height: 1),
                            const SizedBox(height: 8),
                            // Hàng 2: Người theo dõi | Đang theo dõi
                            Row(
                              children: [
                                _StatColTappable(
                                  '$_followersCount',
                                  'Người theo dõi',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => _FollowListScreen(
                                      userId: widget.userId,
                                      title: 'Người theo dõi',
                                      mode: 'followers',
                                    ),
                                  )),
                                ),
                                _divider(),
                                _StatColTappable(
                                  '$_followingCount',
                                  'Đang theo dõi',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => _FollowListScreen(
                                      userId: widget.userId,
                                      title: 'Đang theo dõi',
                                      mode: 'following',
                                    ),
                                  )),
                                ),
                                _divider(),
                                _StatCol(
                                  '${(_reviews?['reviews'] as List?)?.length ?? 0}',
                                  'Lượt đánh giá',
                                ),
                              ],
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
                            childAspectRatio: 0.80,
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
                                    border: Border.all(color: AppTheme.border),
                                  ),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    AppImage(url: imgUrl, height: 120, width: double.infinity,
                                      borderRadius: const BorderRadius.vertical(top: Radius.circular(8))),
                                    Expanded(child: Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Text(post.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                                        const Spacer(),
                                        Text(PostCard.formatPrice(post.price, post.listingType),
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold,
                                            color: isFree ? AppTheme.freeColor : AppTheme.priceColor)),
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

  Widget _StatColTappable(String value, String label, {required VoidCallback onTap}) => Expanded(
    child: InkWell(
      onTap: onTap,
      child: Column(children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primary)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.primary)),
      ]),
    ),
  );
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
                      widget.mode == 'followers'
                          ? 'Chưa có ai theo dõi'
                          : 'Chưa theo dõi ai',
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
          UserAvatar(
            name: review['reviewer']?['name']?.toString(),
            radius: 16,
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
