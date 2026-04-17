import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/post.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import '../widgets/post_card.dart';
import 'post_detail_screen.dart';
import 'auth/phone_login_screen.dart';

class FavoritesTab extends StatefulWidget {
  const FavoritesTab({super.key});

  @override
  State<FavoritesTab> createState() => FavoritesTabState();
}

class FavoritesTabState extends State<FavoritesTab> {
  List<Post> _posts = [];
  bool _isLoading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) {
      setState(() => _isLoading = false);
      return;
    }
    setState(() { _isLoading = true; _error = false; });
    try {
      final data = await ApiService.getFavorites(auth.userId!);
      if (!mounted) return;
      setState(() {
        _posts = data.map((item) => Post.fromJson(item['post'] ?? item)).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ FavoritesTab.load error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _error = true; });
    }
  }

  Future<void> _removeAndReload(String userId, String postId) async {
    // Xóa local ngay lập tức cho cảm giác nhanh
    setState(() => _posts.removeWhere((p) => p.id == postId));
    await ApiService.removeFavorite(userId, postId);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(title: const Text('Bài viết đã lưu')),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.favorite_border, size: 64, color: AppTheme.border),
          const SizedBox(height: 12),
          const Text('Đăng nhập để xem danh sách yêu thích',
              style: TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const PhoneLoginScreen())),
            child: const Text('Đăng nhập'),
          ),
        ])),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Bài viết đã lưu'),
        actions: [
          if (_posts.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text('${_posts.length} tin',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 5,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, __) => const FavoriteItemSkeleton(),
            )
          : _error
              ? RefreshIndicator(
                  onRefresh: load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không tải được danh sách', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: load, child: const Text('Thử lại')),
                      ]),
                    )),
                  )),
                )
          : _posts.isEmpty
              ? RefreshIndicator(
                  onRefresh: load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.favorite_border, size: 72, color: AppTheme.border.withOpacity(0.5)),
                        const SizedBox(height: 16),
                        const Text('Chưa có tin đăng nào được lưu',
                            style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                        const SizedBox(height: 8),
                        const Text('Bấm ♡ trên bài đăng để lưu vào đây',
                            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ]),
                    )),
                  )),
                )
              : RefreshIndicator(
                  onRefresh: load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _posts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) {
                      final post = _posts[i];
                      return _FavoriteItem(
                        post: post,
                        onTap: () => Navigator.push(ctx, MaterialPageRoute(
                          builder: (_) => PostDetailScreen(
                            post: post,
                            isFavorite: true,
                            onToggleFavorite: () async {
                              // API đã gọi trong PostDetailScreen, chỉ cần reload list
                              load();
                            },
                          ),
                        )).then((_) => load()),
                        onRemove: () => _removeAndReload(auth.userId!, post.id),
                      );
                    },
                  ),
                ),
    );
  }
}

class _FavoriteItem extends StatelessWidget {
  final Post post;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const _FavoriteItem({required this.post, required this.onTap, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            // Ảnh
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 90,
                height: 90,
                child: AppImage(
                  url: post.imageLabel.isNotEmpty
                      ? '${ApiService.baseUrl}/uploads/${post.imageLabel}'
                      : '',
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Thông tin
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(post.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, height: 1.3)),
                  const SizedBox(height: 6),
                  Text(PostCard.formatPrice(post.price, post.listingType),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: (post.listingType == 'give' || post.price == 0) ? AppTheme.freeColor : AppTheme.priceColor,
                      )),
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(post.fullAddress,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                    ),
                  ]),
                ],
              ),
            ),
            // Nút bỏ yêu thích
            FavoriteButton(
              isFavorite: true,
              onTap: onRemove,
              iconSize: 20,
              buttonSize: 36,
            ),
          ],
        ),
      ),
    );
  }
}
